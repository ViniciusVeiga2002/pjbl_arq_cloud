import test from 'node:test';
import assert from 'node:assert/strict';
import ExcluirPedidoCasoDeUso from '../../src/features/pedidos/excluir-pedido/ExcluirPedidoCasoDeUso';
import ExcluirPedidoComando from '../../src/features/pedidos/excluir-pedido/ExcluirPedidoComando';
import Pedido from '../../src/dominio/Pedido';
import { PortaRepositorioExclusao } from '../../src/features/pedidos/excluir-pedido/PortaRepositorioExclusao';
import PedidoNaoEncontradoError from '../../src/dominio/erros/PedidoNaoEncontradoError';
import { criarPublicadorDeEventosFalso } from '../falsos/publicadorDeEventosFalso';

function criarRepositorioFalso(pedidoRemovido: Partial<Pedido> | null) {
  const idsExcluidos: string[] = [];
  return {
    idsExcluidos,
    async excluirPorId(id: string) {
      idsExcluidos.push(id);
      return pedidoRemovido as Pedido | null;
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
  assert.throws(() => new ExcluirPedidoCasoDeUso({} as PortaRepositorioExclusao, criarPublicadorDeEventosFalso()), TypeError);
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
