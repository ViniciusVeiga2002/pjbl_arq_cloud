import test from 'node:test';
import assert from 'node:assert/strict';
import { enriquecer } from '../../src/dominio/AvaliacaoDeRisco';
import CalcularRiscoCasoDeUso from '../../src/features/enriquecimento/calcular-risco/CalcularRiscoCasoDeUso';

const AGORA = new Date('2026-11-12T12:00:00Z');

test('pedido entregue tem risco zero', () => {
  const r = enriquecer([{ id: 'P1', status: 'Entregue', previsaoEntrega: '2026-01-01T00:00:00Z' }], [], AGORA);
  assert.equal(r.pedidos[0].score, 0);
  assert.equal(r.resumo.pedidosEntregues, 1);
});

test('pedido atrasado com veículo em alerta tem risco alto (80)', () => {
  const r = enriquecer(
    [{ id: 'P1', status: 'Em rota', veiculoPlaca: 'ABC', previsaoEntrega: '2026-11-12T10:00:00Z' }],
    [{ placa: 'ABC', status: 'alerta-velocidade' }],
    AGORA
  );
  assert.equal(r.pedidos[0].score, 80);
  assert.equal(r.pedidos[0].nivel, 'alto');
  assert.deepEqual(r.pedidos[0].motivos, ['entrega atrasada', 'veículo com excesso de velocidade']);
  assert.equal(r.resumo.pedidosAtrasados, 1);
  assert.equal(r.resumo.taxaDeAtraso, 1);
});

test('coleta pendente com prazo curto soma 20 (risco baixo)', () => {
  const r = enriquecer([{ id: 'P1', status: 'Aguardando coleta', previsaoEntrega: '2026-11-12T14:00:00Z' }], [], AGORA);
  assert.equal(r.pedidos[0].score, 20);
  assert.equal(r.pedidos[0].nivel, 'baixo');
});

test('lista vazia gera resumo zerado', () => {
  const r = enriquecer([], [], AGORA);
  assert.deepEqual(r.resumo, { totalDePedidos: 0, pedidosAtrasados: 0, pedidosEntregues: 0, taxaDeAtraso: 0, riscoMedio: 0, nivelGeral: 'baixo' });
});

test('pedido sem id e corpo sem lista são rejeitados', () => {
  assert.throws(() => enriquecer([{ id: '' }], [], AGORA), /id/);
  assert.throws(() => enriquecer(undefined as never, [], AGORA), /pedidos/);
});

test('caso de uso usa o relógio injetado', () => {
  const caso = new CalcularRiscoCasoDeUso(() => AGORA);
  const r = caso.executar({ pedidos: [{ id: 'P1', status: 'Atrasado' }], veiculos: [] });
  assert.equal(r.geradoEm, AGORA.toISOString());
  assert.equal(r.pedidos[0].score, 50);
});
