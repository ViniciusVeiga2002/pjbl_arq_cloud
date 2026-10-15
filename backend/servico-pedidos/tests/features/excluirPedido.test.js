const test = require('node:test');
const assert = require('node:assert/strict');
const ExcluirPedidoCasoDeUso = require('../../src/features/pedidos/excluir-pedido/ExcluirPedidoCasoDeUso');
const ExcluirPedidoComando = require('../../src/features/pedidos/excluir-pedido/ExcluirPedidoComando');
const PedidoNaoEncontradoError = require('../../src/dominio/erros/PedidoNaoEncontradoError');
const { criarPublicadorDeEventosFalso } = require('../falsos/publicadorDeEventosFalso');

function criarRepositorioFalso(pedidoRemovido) {
  const idsExcluidos = [];
  return {
    idsExcluidos,
    async excluirPorId(id) {
      idsExcluidos.push(id);
      return pedidoRemovido;
    },
  };
}

test('ExcluirPedidoCasoDeUso devolve { sucesso: true, id } no caminho feliz', async () => {
  const repositorio = criarRepositorioFalso({ id: 'PED-123456' });
  const casoDeUso = new ExcluirPedidoCasoDeUso(repositorio, criarPublicadorDeEventosFalso());

  const resultado = await casoDeUso.executar(new ExcluirPedidoComando({ id: 'PED-123456' }));

  assert.deepEqual(resultado, { sucesso: true, id: 'PED-123456' });
  assert.deepEqual(repositorio.idsExcluidos, ['PED-123456']);
});

test('ExcluirPedidoCasoDeUso lança PedidoNaoEncontradoError quando a porta devolve null', async () => {
  const repositorio = criarRepositorioFalso(null);
  const casoDeUso = new ExcluirPedidoCasoDeUso(repositorio, criarPublicadorDeEventosFalso());

  await assert.rejects(
    () => casoDeUso.executar(new ExcluirPedidoComando({ id: 'PED-999999' })),
    PedidoNaoEncontradoError
  );
});

test('ExcluirPedidoCasoDeUso rejeita um adaptador que não implementa a porta', () => {
  assert.throws(() => new ExcluirPedidoCasoDeUso({}, criarPublicadorDeEventosFalso()), TypeError);
});

test('ExcluirPedidoCasoDeUso publica PedidoExcluido com a entrega do pedido removido', async () => {
  const publicador = criarPublicadorDeEventosFalso();
  const casoDeUso = new ExcluirPedidoCasoDeUso(
    criarRepositorioFalso({ id: 'PED-123456', entregaId: 'ENT-502' }),
    publicador
  );

  await casoDeUso.executar(new ExcluirPedidoComando({ id: 'PED-123456' }));

  assert.equal(publicador.eventosPublicados.length, 1);
  assert.equal(publicador.eventosPublicados[0].tipo, 'PedidoExcluido');
  assert.equal(publicador.eventosPublicados[0].dados.entregaId, 'ENT-502');
});
