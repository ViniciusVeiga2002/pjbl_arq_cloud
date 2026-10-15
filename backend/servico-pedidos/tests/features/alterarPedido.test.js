const test = require('node:test');
const assert = require('node:assert/strict');
const AlterarPedidoCasoDeUso = require('../../src/features/pedidos/alterar-pedido/AlterarPedidoCasoDeUso');
const AlterarPedidoComando = require('../../src/features/pedidos/alterar-pedido/AlterarPedidoComando');
const ErroDeValidacao = require('../../src/dominio/erros/ErroDeValidacao');
const PedidoNaoEncontradoError = require('../../src/dominio/erros/PedidoNaoEncontradoError');
const { criarPublicadorDeEventosFalso } = require('../falsos/publicadorDeEventosFalso');

function criarRepositorioFalso(pedidoDevolvido) {
  const chamadas = [];
  return {
    chamadas,
    async atualizarPorId(id, camposParciais) {
      chamadas.push({ id, camposParciais });
      return pedidoDevolvido;
    },
  };
}

test('AlterarPedidoCasoDeUso aplica a atualização parcial e devolve o pedido atualizado', async () => {
  const pedidoAtualizado = { id: 'PED-123456', status: 'Em rota' };
  const repositorio = criarRepositorioFalso(pedidoAtualizado);
  const casoDeUso = new AlterarPedidoCasoDeUso(repositorio, criarPublicadorDeEventosFalso());

  const comando = new AlterarPedidoComando({ id: 'PED-123456', campos: { status: 'Em rota' } });
  const resultado = await casoDeUso.executar(comando);

  assert.equal(resultado, pedidoAtualizado);
  assert.equal(repositorio.chamadas.length, 1);
  assert.equal(repositorio.chamadas[0].id, 'PED-123456');
  assert.equal(repositorio.chamadas[0].camposParciais.status, 'Em rota');
  assert.ok(repositorio.chamadas[0].camposParciais.atualizadoEm);
});

test('AlterarPedidoCasoDeUso lança PedidoNaoEncontradoError quando a porta devolve null', async () => {
  const repositorio = criarRepositorioFalso(null);
  const casoDeUso = new AlterarPedidoCasoDeUso(repositorio, criarPublicadorDeEventosFalso());

  const comando = new AlterarPedidoComando({ id: 'PED-999999', campos: { status: 'Entregue' } });
  await assert.rejects(() => casoDeUso.executar(comando), PedidoNaoEncontradoError);
});

test('AlterarPedidoCasoDeUso lança ErroDeValidacao sem chamar a porta quando não há campo válido', async () => {
  const repositorio = criarRepositorioFalso({ id: 'PED-123456' });
  const casoDeUso = new AlterarPedidoCasoDeUso(repositorio, criarPublicadorDeEventosFalso());

  const comando = new AlterarPedidoComando({ id: 'PED-123456', campos: { campoDesconhecido: 'x' } });
  await assert.rejects(() => casoDeUso.executar(comando), ErroDeValidacao);
  assert.equal(repositorio.chamadas.length, 0);
});

test('AlterarPedidoCasoDeUso lança ErroDeValidacao quando o status enviado é inválido', async () => {
  const repositorio = criarRepositorioFalso({ id: 'PED-123456' });
  const casoDeUso = new AlterarPedidoCasoDeUso(repositorio, criarPublicadorDeEventosFalso());

  const comando = new AlterarPedidoComando({ id: 'PED-123456', campos: { status: 'Cancelado' } });
  await assert.rejects(() => casoDeUso.executar(comando), ErroDeValidacao);
  assert.equal(repositorio.chamadas.length, 0);
});

test('AlterarPedidoCasoDeUso publica PedidoAlterado com o estado final do pedido', async () => {
  const pedidoAtualizado = { id: 'PED-123456', entregaId: 'ENT-501', status: 'Entregue' };
  const publicador = criarPublicadorDeEventosFalso();
  const casoDeUso = new AlterarPedidoCasoDeUso(criarRepositorioFalso(pedidoAtualizado), publicador);

  await casoDeUso.executar(new AlterarPedidoComando({ id: 'PED-123456', campos: { status: 'Entregue' } }));

  assert.equal(publicador.eventosPublicados.length, 1);
  assert.equal(publicador.eventosPublicados[0].tipo, 'PedidoAlterado');
  assert.equal(publicador.eventosPublicados[0].dados.status, 'Entregue');
});

test('AlterarPedidoCasoDeUso não publica evento quando o pedido não existe', async () => {
  const publicador = criarPublicadorDeEventosFalso();
  const casoDeUso = new AlterarPedidoCasoDeUso(criarRepositorioFalso(null), publicador);

  await assert.rejects(
    () => casoDeUso.executar(new AlterarPedidoComando({ id: 'PED-999999', campos: { status: 'Entregue' } })),
    PedidoNaoEncontradoError
  );
  assert.equal(publicador.eventosPublicados.length, 0);
});
