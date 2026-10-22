import test from 'node:test';
import assert from 'node:assert/strict';
import ListarEntregasCasoDeUso from '../../src/features/entregas/listar-entregas/ListarEntregasCasoDeUso';
import ListarEntregasFiltro from '../../src/features/entregas/listar-entregas/ListarEntregasFiltro';
import { PortaRepositorioConsultaDeEntregas } from '../../src/features/entregas/listar-entregas/PortaRepositorioConsultaDeEntregas';
import Entrega from '../../src/dominio/Entrega';
import { eventoDePedido } from '../eventos';

function entrega(id: string, ...status: string[]) {
  const resultado = Entrega.nova(id);
  status.forEach((s, i) =>
    resultado.aplicar(eventoDePedido('PedidoCadastrado', '2026-10-14T10:00:00.000Z', { id: `${id}-PED-${i}`, entregaId: id, status: s }))
  );
  return resultado;
}

const repositorio = {
  async listar() {
    return [entrega('ENT-501', 'Em rota'), entrega('ENT-502', 'Atrasado'), entrega('ENT-503')];
  },
};

test('ListarEntregasCasoDeUso devolve resumos e omite entregas sem pedidos', async () => {
  const resumos = await new ListarEntregasCasoDeUso(repositorio).executar(new ListarEntregasFiltro());
  assert.deepEqual(resumos.map((r) => r.id), ['ENT-501', 'ENT-502']);
});

test('ListarEntregasCasoDeUso filtra pela situação calculada', async () => {
  const resumos = await new ListarEntregasCasoDeUso(repositorio).executar(new ListarEntregasFiltro({ situacao: 'Com atraso' }));
  assert.deepEqual(resumos.map((r) => r.id), ['ENT-502']);
});

test('ListarEntregasCasoDeUso rejeita um adaptador que não implementa a porta', () => {
  assert.throws(() => new ListarEntregasCasoDeUso({} as PortaRepositorioConsultaDeEntregas), TypeError);
});
