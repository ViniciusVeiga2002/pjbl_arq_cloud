import test from 'node:test';
import assert from 'node:assert/strict';
import PesquisarPedidosCasoDeUso from '../../src/features/pedidos/pesquisar-pedidos/PesquisarPedidosCasoDeUso';
import Pedido from '../../src/dominio/Pedido';
import { PortaRepositorioConsulta } from '../../src/features/pedidos/pesquisar-pedidos/PortaRepositorioConsulta';
import PesquisarPedidosFiltro from '../../src/features/pedidos/pesquisar-pedidos/PesquisarPedidosFiltro';

function criarRepositorioFalso(pedidosFixos: Pedido[]) {
  const filtrosRecebidos: Partial<PesquisarPedidosFiltro>[] = [];
  return {
    filtrosRecebidos,
    async buscarComFiltro(criterios: Partial<PesquisarPedidosFiltro>) {
      filtrosRecebidos.push(criterios);
      return pedidosFixos;
    },
  };
}

test('PesquisarPedidosCasoDeUso devolve exatamente o que a porta retornou', async () => {
  const pedidosFixos = [{ id: 'PED-000001' }, { id: 'PED-000002' }] as Pedido[];
  const repositorio = criarRepositorioFalso(pedidosFixos);
  const casoDeUso = new PesquisarPedidosCasoDeUso(repositorio);

  const filtro = new PesquisarPedidosFiltro({ cliente: 'norte' });
  const resultado = await casoDeUso.executar(filtro);

  assert.equal(resultado, pedidosFixos);
});

test('PesquisarPedidosCasoDeUso repassa o filtro recebido sem alterar', async () => {
  const repositorio = criarRepositorioFalso([]);
  const casoDeUso = new PesquisarPedidosCasoDeUso(repositorio);

  const filtro = new PesquisarPedidosFiltro({ id: 'PED-123456', entregaId: 'ENT-501', status: 'Em rota', cliente: 'Sul' });
  await casoDeUso.executar(filtro);

  assert.equal(repositorio.filtrosRecebidos.length, 1);
  assert.deepEqual(repositorio.filtrosRecebidos[0], filtro);
  assert.equal(repositorio.filtrosRecebidos[0].clienteContendo, 'Sul');
});

test('PesquisarPedidosCasoDeUso rejeita um adaptador que não implementa a porta', () => {
  assert.throws(() => new PesquisarPedidosCasoDeUso({} as PortaRepositorioConsulta), TypeError);
});
