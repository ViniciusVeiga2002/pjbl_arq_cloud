const test = require('node:test');
const assert = require('node:assert/strict');
const TabelaDeRotas = require('../../src/dominio/TabelaDeRotas');

test('TabelaDeRotas resolve o prefixo "web" para o BFF web e remove o prefixo do caminho', () => {
  const { rota, caminhoNoDestino } = TabelaDeRotas.resolver('web/pedidos/PED-123456');
  assert.equal(rota.destino, 'bff-web');
  assert.equal(caminhoNoDestino, 'pedidos/PED-123456');
});

test('TabelaDeRotas não resolve prefixos desconhecidos nem caminho vazio', () => {
  assert.equal(TabelaDeRotas.resolver('pedidos'), null);
  assert.equal(TabelaDeRotas.resolver(''), null);
});
