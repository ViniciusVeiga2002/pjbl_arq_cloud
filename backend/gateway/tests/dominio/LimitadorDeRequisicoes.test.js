const test = require('node:test');
const assert = require('node:assert/strict');
const LimitadorDeRequisicoes = require('../../src/dominio/LimitadorDeRequisicoes');

test('LimitadorDeRequisicoes bloqueia acima do limite dentro da janela', () => {
  const limitador = new LimitadorDeRequisicoes({ limite: 2, janelaMs: 60_000 });
  assert.equal(limitador.registrar('1.1.1.1', 0).permitido, true);
  assert.equal(limitador.registrar('1.1.1.1', 1000).restantes, 0);

  const bloqueado = limitador.registrar('1.1.1.1', 2000);
  assert.equal(bloqueado.permitido, false);
  assert.equal(bloqueado.tentarNovamenteEmSegundos, 58);
});

test('LimitadorDeRequisicoes conta cada cliente separadamente e reabre na janela seguinte', () => {
  const limitador = new LimitadorDeRequisicoes({ limite: 1, janelaMs: 60_000 });
  limitador.registrar('1.1.1.1', 0);
  assert.equal(limitador.registrar('2.2.2.2', 0).permitido, true);
  assert.equal(limitador.registrar('1.1.1.1', 60_000).permitido, true);
});
