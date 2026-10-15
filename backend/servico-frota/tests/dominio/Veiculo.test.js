const test = require('node:test');
const assert = require('node:assert/strict');
const Veiculo = require('../../src/dominio/Veiculo');
const ErroDeValidacao = require('../../src/dominio/erros/ErroDeValidacao');

const leitura = { placa: 'ABC-1D23', motorista: 'Juliana Ferreira', lat: -23.55, lng: -46.63, velocidade: 60 };

test('Veiculo calcula o status a partir da velocidade (RF08)', () => {
  assert.equal(Veiculo.registrarLeitura({ ...leitura, velocidade: 0 }).status, 'parado');
  assert.equal(Veiculo.registrarLeitura({ ...leitura, velocidade: 80 }).status, 'ok');
  assert.equal(Veiculo.registrarLeitura({ ...leitura, velocidade: 81 }).status, 'alerta-velocidade');
});

test('Veiculo exige placa', () => {
  assert.throws(() => Veiculo.registrarLeitura({ ...leitura, placa: '' }), ErroDeValidacao);
});

test('Veiculo rejeita coordenadas e velocidades inválidas', () => {
  assert.throws(() => Veiculo.registrarLeitura({ ...leitura, lat: 91 }), ErroDeValidacao);
  assert.throws(() => Veiculo.registrarLeitura({ ...leitura, lng: -181 }), ErroDeValidacao);
  assert.throws(() => Veiculo.registrarLeitura({ ...leitura, velocidade: -1 }), ErroDeValidacao);
  assert.throws(() => Veiculo.registrarLeitura({ ...leitura, velocidade: '50' }), ErroDeValidacao);
});
