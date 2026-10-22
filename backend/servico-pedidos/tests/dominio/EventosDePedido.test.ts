import test from 'node:test';
import assert from 'node:assert/strict';
import EventosDePedido from '../../src/dominio/eventos/EventosDePedido';

const pedido = {
  id: 'PED-123456',
  cliente: 'Mercado Bom Preço',
  entregaId: 'ENT-501',
  veiculoPlaca: 'ABC-1D23',
  status: 'Em rota',
  previsaoEntrega: '2026-10-20T18:00:00.000Z',
};

test('EventosDePedido monta o envelope com tipo, versão, data e dados', () => {
  const evento = EventosDePedido.pedidoCadastrado(pedido);

  assert.equal(evento.tipo, 'PedidoCadastrado');
  assert.equal(evento.versao, 1);
  assert.ok(!Number.isNaN(Date.parse(evento.ocorridoEm)));
  assert.deepEqual(evento.dados, {
    id: 'PED-123456',
    entregaId: 'ENT-501',
    veiculoPlaca: 'ABC-1D23',
    status: 'Em rota',
    previsaoEntrega: '2026-10-20T18:00:00.000Z',
  });
});

test('EventosDePedido não expõe o nome do cliente nos eventos (mínimo de dados necessário)', () => {
  for (const fabrica of [EventosDePedido.pedidoCadastrado, EventosDePedido.pedidoAlterado, EventosDePedido.pedidoExcluido]) {
    assert.equal((fabrica(pedido).dados as object as Record<string, unknown>).cliente, undefined);
  }
});

test('EventosDePedido usa um tipo distinto para cada fato', () => {
  assert.equal(EventosDePedido.pedidoAlterado(pedido).tipo, 'PedidoAlterado');
  assert.equal(EventosDePedido.pedidoExcluido(pedido).tipo, 'PedidoExcluido');
});
