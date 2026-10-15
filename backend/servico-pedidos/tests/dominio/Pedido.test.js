const test = require('node:test');
const assert = require('node:assert/strict');
const Pedido = require('../../src/dominio/Pedido');
const StatusPedido = require('../../src/dominio/StatusPedido');
const ErroDeValidacao = require('../../src/dominio/erros/ErroDeValidacao');

test('Pedido.criar aplica os valores default e gera id público PED-######', () => {
  const pedido = Pedido.criar({ cliente: 'Transportes Sul', entregaId: 'ENT-501' });

  assert.match(pedido.id, /^PED-\d{6}$/);
  assert.equal(pedido.cliente, 'Transportes Sul');
  assert.equal(pedido.entregaId, 'ENT-501');
  assert.equal(pedido.veiculoPlaca, '');
  assert.equal(pedido.status, StatusPedido.AGUARDANDO_COLETA);
  assert.ok(pedido.criadoEm);
  assert.ok(pedido.previsaoEntrega);
});

test('Pedido.criar lança ErroDeValidacao quando cliente ou entregaId estão ausentes', () => {
  assert.throws(() => Pedido.criar({ entregaId: 'ENT-501' }), ErroDeValidacao);
  assert.throws(() => Pedido.criar({ cliente: 'Transportes Sul' }), ErroDeValidacao);
  assert.throws(() => Pedido.criar(), ErroDeValidacao);
});

test('Pedido.criar lança ErroDeValidacao quando o status não pertence ao conjunto válido', () => {
  assert.throws(
    () => Pedido.criar({ cliente: 'Transportes Sul', entregaId: 'ENT-501', status: 'Cancelado' }),
    ErroDeValidacao
  );
});

test('Pedido.construirAtualizacaoParcial mantém só os campos permitidos enviados', () => {
  const atualizacao = Pedido.construirAtualizacaoParcial({
    status: StatusPedido.EM_ROTA,
    campoDesconhecido: 'deve ser ignorado',
  });

  assert.deepEqual(Object.keys(atualizacao).sort(), ['atualizadoEm', 'status']);
  assert.equal(atualizacao.status, StatusPedido.EM_ROTA);
});

test('Pedido.construirAtualizacaoParcial lança ErroDeValidacao sem nenhum campo válido', () => {
  assert.throws(() => Pedido.construirAtualizacaoParcial({ campoDesconhecido: 'x' }), ErroDeValidacao);
  assert.throws(() => Pedido.construirAtualizacaoParcial({}), ErroDeValidacao);
});

test('Pedido.construirAtualizacaoParcial valida o status quando ele é enviado', () => {
  assert.throws(() => Pedido.construirAtualizacaoParcial({ status: 'Cancelado' }), ErroDeValidacao);
});
