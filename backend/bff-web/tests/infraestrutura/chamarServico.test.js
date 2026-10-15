const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const chamarServico = require('../../src/infraestrutura/clientes/chamarServico');
const ErroDeServicoRemoto = require('../../src/aplicacao/erros/ErroDeServicoRemoto');
const mapearErroParaHttp = require('../../src/infraestrutura/http/mapearErroParaHttp');

// Microsserviço falso (servidor HTTP local) para verificar o contrato do
// cliente: cabeçalhos enviados e tradução das respostas de erro.
function subirServicoFalso(responder) {
  return new Promise((resolve) => {
    const servidor = http.createServer(responder).listen(0, () => {
      resolve({ servidor, urlBase: `http://127.0.0.1:${servidor.address().port}/api` });
    });
  });
}

test('chamarServico envia a chave da Function e o correlation-id ao microsserviço', async (t) => {
  let cabecalhos;
  const { servidor, urlBase } = await subirServicoFalso((req, res) => {
    cabecalhos = req.headers;
    res.setHeader('content-type', 'application/json');
    res.end('[]');
  });
  t.after(() => servidor.close());

  await chamarServico({ servico: 'teste', urlBase, chave: 'k123', correlationId: 'c-1', caminho: 'pedidos' });

  assert.equal(cabecalhos['x-functions-key'], 'k123');
  assert.equal(cabecalhos['x-correlation-id'], 'c-1');
});

test('chamarServico transforma 404 do microsserviço em ErroDeServicoRemoto de cliente', async (t) => {
  const { servidor, urlBase } = await subirServicoFalso((req, res) => {
    res.statusCode = 404;
    res.end(JSON.stringify({ erro: 'Pedido PED-1 não encontrado' }));
  });
  t.after(() => servidor.close());

  await assert.rejects(
    () => chamarServico({ servico: 'teste', urlBase, caminho: 'pedidos/PED-1' }),
    (erro) => erro instanceof ErroDeServicoRemoto && erro.status === 404 && erro.ehErroDoCliente()
  );
});

test('chamarServico devolve 502 quando o microsserviço não está no ar', async () => {
  await assert.rejects(
    () => chamarServico({ servico: 'teste', urlBase: 'http://127.0.0.1:1/api', caminho: 'pedidos' }),
    (erro) => erro instanceof ErroDeServicoRemoto && erro.status === 502
  );
});

test('mapearErroParaHttp repassa 4xx e converte falhas de dependência em 502', () => {
  const context = { error() {} };
  assert.equal(mapearErroParaHttp(new ErroDeServicoRemoto('s', 400, 'inválido'), context).status, 400);
  assert.equal(mapearErroParaHttp(new ErroDeServicoRemoto('s', 500, 'falhou'), context).status, 502);
  assert.equal(mapearErroParaHttp(new ErroDeServicoRemoto('s', 504, 'lento'), context).status, 504);
  assert.equal(mapearErroParaHttp(new Error('x'), context).status, 500);
});
