import test from 'node:test';
import assert from 'node:assert/strict';
import ObterPainelFrotaCasoDeUso from '../../src/features/painel/obter-painel-frota/ObterPainelFrotaCasoDeUso';

test('ObterPainelFrotaCasoDeUso calcula os indicadores da tela a partir do servico-frota', async () => {
  const servicoDeFrota = {
    listarVeiculos: async () => [
      { placa: 'AAA-0A00', status: 'ok' },
      { placa: 'BBB-1B11', status: 'alerta-velocidade' },
      { placa: 'CCC-2C22', status: 'parado' },
    ],
    listarEntregas: async () => [{ situacao: 'Concluída' }, { situacao: 'Com atraso' }, { situacao: 'Em rota' }],
  };

  const painel = await new ObterPainelFrotaCasoDeUso(servicoDeFrota).executar();

  assert.deepEqual(painel.indicadores, {
    veiculos: 3,
    veiculosEmAlerta: 1,
    entregasEmAndamento: 2,
    entregasComAtraso: 1,
  });
  assert.equal(painel.veiculos.length, 3);
  assert.equal(painel.entregas.length, 3);
});
