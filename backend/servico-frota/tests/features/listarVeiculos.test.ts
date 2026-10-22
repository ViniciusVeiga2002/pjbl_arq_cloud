import test from 'node:test';
import assert from 'node:assert/strict';
import ListarVeiculosCasoDeUso from '../../src/features/veiculos/listar-veiculos/ListarVeiculosCasoDeUso';
import Veiculo from '../../src/dominio/Veiculo';
import { PortaRepositorioConsultaDeVeiculos } from '../../src/features/veiculos/listar-veiculos/PortaRepositorioConsultaDeVeiculos';
import ListarVeiculosFiltro from '../../src/features/veiculos/listar-veiculos/ListarVeiculosFiltro';

test('ListarVeiculosCasoDeUso repassa o filtro e devolve o que a porta retornou', async () => {
  const veiculos = [{ placa: 'ABC-1D23' }] as Veiculo[];
  const filtrosRecebidos: (Partial<ListarVeiculosFiltro> | undefined)[] = [];
  const casoDeUso = new ListarVeiculosCasoDeUso({
    async listar(filtro?: Partial<ListarVeiculosFiltro>) {
      filtrosRecebidos.push(filtro);
      return veiculos;
    },
  });

  const filtro = new ListarVeiculosFiltro({ status: 'alerta-velocidade' });
  assert.equal(await casoDeUso.executar(filtro), veiculos);
  assert.deepEqual(filtrosRecebidos, [filtro]);
});

test('ListarVeiculosCasoDeUso rejeita um adaptador que não implementa a porta', () => {
  assert.throws(() => new ListarVeiculosCasoDeUso({} as PortaRepositorioConsultaDeVeiculos), TypeError);
});
