const test = require('node:test');
const assert = require('node:assert/strict');
const ListarVeiculosCasoDeUso = require('../../src/features/veiculos/listar-veiculos/ListarVeiculosCasoDeUso');
const ListarVeiculosFiltro = require('../../src/features/veiculos/listar-veiculos/ListarVeiculosFiltro');

test('ListarVeiculosCasoDeUso repassa o filtro e devolve o que a porta retornou', async () => {
  const veiculos = [{ placa: 'ABC-1D23' }];
  const filtrosRecebidos = [];
  const casoDeUso = new ListarVeiculosCasoDeUso({
    async listar(filtro) {
      filtrosRecebidos.push(filtro);
      return veiculos;
    },
  });

  const filtro = new ListarVeiculosFiltro({ status: 'alerta-velocidade' });
  assert.equal(await casoDeUso.executar(filtro), veiculos);
  assert.deepEqual(filtrosRecebidos, [filtro]);
});

test('ListarVeiculosCasoDeUso rejeita um adaptador que não implementa a porta', () => {
  assert.throws(() => new ListarVeiculosCasoDeUso({}), TypeError);
});
