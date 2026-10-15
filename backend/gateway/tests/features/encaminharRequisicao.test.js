const test = require('node:test');
const assert = require('node:assert/strict');
const EncaminharRequisicaoCasoDeUso = require('../../src/features/roteamento/encaminhar-requisicao/EncaminharRequisicaoCasoDeUso');
const LimitadorDeRequisicoes = require('../../src/dominio/LimitadorDeRequisicoes');

// Encaminhador falso: registra o que o gateway mandaria ao BFF.
function criarEncaminhadorFalso() {
  const encaminhadas = [];
  return {
    encaminhadas,
    async encaminhar(pedido) {
      encaminhadas.push(pedido);
      return { status: 200, corpo: '[]' };
    },
  };
}

const requisicao = { metodo: 'GET', caminho: 'web/pedidos', consulta: '?cliente=norte', cliente: '1.1.1.1', correlationId: 'abc-12345' };

test('EncaminharRequisicaoCasoDeUso encaminha ao BFF com caminho, consulta e correlation-id', async () => {
  const encaminhador = criarEncaminhadorFalso();
  const casoDeUso = new EncaminharRequisicaoCasoDeUso(encaminhador, new LimitadorDeRequisicoes({ limite: 10, janelaMs: 60_000 }));

  const resposta = await casoDeUso.executar(requisicao);

  assert.equal(resposta.status, 200);
  assert.equal(resposta.cabecalhos['x-ratelimit-remaining'], '9');
  assert.deepEqual(encaminhador.encaminhadas[0], {
    destino: 'bff-web',
    metodo: 'GET',
    caminho: 'pedidos',
    consulta: '?cliente=norte',
    corpo: undefined,
    cabecalhos: { 'x-correlation-id': 'abc-12345' },
  });
});

test('EncaminharRequisicaoCasoDeUso responde 404 para rota desconhecida sem encaminhar', async () => {
  const encaminhador = criarEncaminhadorFalso();
  const casoDeUso = new EncaminharRequisicaoCasoDeUso(encaminhador, new LimitadorDeRequisicoes({ limite: 10, janelaMs: 60_000 }));

  const resposta = await casoDeUso.executar({ ...requisicao, caminho: 'pedidos' });

  assert.equal(resposta.status, 404);
  assert.equal(encaminhador.encaminhadas.length, 0);
});

test('EncaminharRequisicaoCasoDeUso responde 405 para método não permitido na rota', async () => {
  const casoDeUso = new EncaminharRequisicaoCasoDeUso(criarEncaminhadorFalso(), new LimitadorDeRequisicoes({ limite: 10, janelaMs: 60_000 }));
  assert.equal((await casoDeUso.executar({ ...requisicao, metodo: 'PATCH' })).status, 405);
});

test('EncaminharRequisicaoCasoDeUso responde 429 com Retry-After acima do limite', async () => {
  const encaminhador = criarEncaminhadorFalso();
  const casoDeUso = new EncaminharRequisicaoCasoDeUso(encaminhador, new LimitadorDeRequisicoes({ limite: 1, janelaMs: 60_000 }));

  await casoDeUso.executar(requisicao);
  const resposta = await casoDeUso.executar(requisicao);

  assert.equal(resposta.status, 429);
  assert.ok(Number(resposta.cabecalhos['retry-after']) > 0);
  assert.equal(encaminhador.encaminhadas.length, 1);
});

test('EncaminharRequisicaoCasoDeUso rejeita um adaptador que não implementa a porta', () => {
  assert.throws(() => new EncaminharRequisicaoCasoDeUso({}, null), TypeError);
});
