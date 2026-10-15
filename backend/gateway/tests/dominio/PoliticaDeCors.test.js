const test = require('node:test');
const assert = require('node:assert/strict');
const PoliticaDeCors = require('../../src/dominio/PoliticaDeCors');

test('PoliticaDeCors devolve cabeçalhos só para origens permitidas (nada de "*")', () => {
  const politica = new PoliticaDeCors(['http://localhost:5173']);
  assert.equal(politica.cabecalhosPara('http://localhost:5173')['access-control-allow-origin'], 'http://localhost:5173');
  assert.deepEqual(politica.cabecalhosPara('https://site-qualquer.com'), {});
  assert.deepEqual(politica.cabecalhosPara(null), {});
});
