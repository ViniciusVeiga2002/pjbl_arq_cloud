const test = require('node:test');
const assert = require('node:assert/strict');
const Entrega = require('../../src/dominio/Entrega');
const ErroDeValidacao = require('../../src/dominio/erros/ErroDeValidacao');
const { eventoDePedido } = require('../eventos');

const T1 = '2026-10-14T10:00:00.000Z';
const T2 = '2026-10-14T11:00:00.000Z';
const T3 = '2026-10-14T12:00:00.000Z';

function entregaCom(...eventos) {
  const entrega = Entrega.nova('ENT-501');
  for (const evento of eventos) entrega.aplicar(evento);
  return entrega;
}

test('Entrega aplica PedidoCadastrado e assume a placa do veículo', () => {
  const entrega = entregaCom(eventoDePedido('PedidoCadastrado', T1, { id: 'PED-1', entregaId: 'ENT-501' }));
  assert.equal(entrega.pedidosAtivos().length, 1);
  assert.equal(entrega.veiculoPlaca, 'ABC-1D23');
});

test('Entrega calcula a situação a partir dos pedidos ativos', () => {
  const cadastrado = (id, status) => eventoDePedido('PedidoCadastrado', T1, { id, entregaId: 'ENT-501', status });
  assert.equal(entregaCom(cadastrado('PED-1', 'Entregue'), cadastrado('PED-2', 'Entregue')).situacao(), 'Concluída');
  assert.equal(entregaCom(cadastrado('PED-1', 'Em rota'), cadastrado('PED-2', 'Atrasado')).situacao(), 'Com atraso');
  assert.equal(entregaCom(cadastrado('PED-1', 'Em rota'), cadastrado('PED-2', 'Entregue')).situacao(), 'Em rota');
  assert.equal(entregaCom(cadastrado('PED-1', 'Aguardando coleta')).situacao(), 'Aguardando coleta');
});

test('Entrega fica "Sem pedidos" quando o único pedido é excluído', () => {
  const entrega = entregaCom(
    eventoDePedido('PedidoCadastrado', T1, { id: 'PED-1', entregaId: 'ENT-501' }),
    eventoDePedido('PedidoExcluido', T2, { id: 'PED-1', entregaId: 'ENT-501' })
  );
  assert.equal(entrega.situacao(), 'Sem pedidos');
});

test('Entrega ignora evento mais antigo que o já aplicado (fila sem ordem garantida)', () => {
  const entrega = entregaCom(eventoDePedido('PedidoAlterado', T2, { id: 'PED-1', entregaId: 'ENT-501', status: 'Entregue' }));
  const aplicado = entrega.aplicar(eventoDePedido('PedidoAlterado', T1, { id: 'PED-1', entregaId: 'ENT-501', status: 'Em rota' }));
  assert.equal(aplicado, false);
  assert.equal(entrega.pedidosAtivos()[0].status, 'Entregue');
});

test('Entrega não ressuscita pedido excluído quando chega um PedidoAlterado atrasado', () => {
  const entrega = entregaCom(
    eventoDePedido('PedidoCadastrado', T1, { id: 'PED-1', entregaId: 'ENT-501' }),
    eventoDePedido('PedidoExcluido', T3, { id: 'PED-1', entregaId: 'ENT-501' }),
    eventoDePedido('PedidoAlterado', T2, { id: 'PED-1', entregaId: 'ENT-501', status: 'Em rota' })
  );
  assert.equal(entrega.pedidosAtivos().length, 0);
});

test('Entrega é idempotente: aplicar o mesmo evento duas vezes dá o mesmo resumo', () => {
  const evento = eventoDePedido('PedidoCadastrado', T1, { id: 'PED-1', entregaId: 'ENT-501', status: 'Em rota' });
  const umaVez = entregaCom(evento).resumo();
  const duasVezes = entregaCom(evento, evento).resumo();
  assert.deepEqual(duasVezes, umaVez);
});

test('Entrega.validarEvento rejeita tipo desconhecido e evento sem entregaId', () => {
  assert.throws(() => Entrega.validarEvento({ tipo: 'PedidoCancelado', ocorridoEm: T1, dados: { id: 'PED-1', entregaId: 'ENT-1' } }), ErroDeValidacao);
  assert.throws(() => Entrega.validarEvento(eventoDePedido('PedidoCadastrado', T1, { id: 'PED-1', entregaId: '' })), ErroDeValidacao);
});

test('Entrega.resumo conta apenas os pedidos ativos', () => {
  const entrega = entregaCom(
    eventoDePedido('PedidoCadastrado', T1, { id: 'PED-1', entregaId: 'ENT-501', status: 'Entregue' }),
    eventoDePedido('PedidoCadastrado', T1, { id: 'PED-2', entregaId: 'ENT-501', status: 'Atrasado' }),
    eventoDePedido('PedidoCadastrado', T1, { id: 'PED-3', entregaId: 'ENT-501', status: 'Atrasado' }),
    eventoDePedido('PedidoExcluido', T2, { id: 'PED-3', entregaId: 'ENT-501' })
  );
  const resumo = entrega.resumo();
  assert.equal(resumo.totalDePedidos, 2);
  assert.equal(resumo.pedidosEntregues, 1);
  assert.equal(resumo.pedidosAtrasados, 1);
  assert.equal(resumo.atualizadoEm, T2);
});
