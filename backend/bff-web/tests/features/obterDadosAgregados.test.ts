import test from 'node:test';
import assert from 'node:assert/strict';
import ObterDadosAgregadosCasoDeUso from '../../src/features/agregacao/obter-dados-agregados/ObterDadosAgregadosCasoDeUso';

const pedidos = [{ id: 'P1', status: 'Em rota', veiculoPlaca: 'ABC' }];
const veiculos = [{ placa: 'ABC', status: 'alerta-velocidade' }];
const servicoDePedidos = { pesquisar: async () => pedidos };
const servicoDeFrota = { listarVeiculos: async () => veiculos, listarEntregas: async () => [{ situacao: 'Em rota' }] };

test('agrega pedidos, frota e enriquecimento num único resultado', async () => {
  let recebido: unknown[] = [];
  const funcao = {
    calcularRisco: async (p: unknown, v: unknown) => {
      recebido = [p, v];
      return { geradoEm: 'x', resumo: {}, pedidos: [{ id: 'P1', score: 30, nivel: 'medio', motivos: ['veículo com excesso de velocidade'] }] };
    },
  };
  const dados = await new ObterDadosAgregadosCasoDeUso(servicoDePedidos, servicoDeFrota, funcao).executar();

  assert.deepEqual(dados.pedidos, pedidos);
  assert.deepEqual(dados.frota.veiculos, veiculos);
  assert.equal(dados.enriquecimento?.pedidos[0].score, 30);
  assert.deepEqual(dados.avisos, []);
  assert.deepEqual(recebido, [pedidos, veiculos]);
});

test('se a Function falhar, devolve o restante com aviso (degradação graciosa)', async () => {
  const funcao = { calcularRisco: async () => { throw new Error('timeout'); } };
  const dados = await new ObterDadosAgregadosCasoDeUso(servicoDePedidos, servicoDeFrota, funcao).executar();

  assert.equal(dados.enriquecimento, null);
  assert.equal(dados.pedidos.length, 1);
  assert.match(dados.avisos[0], /funcao-enriquecimento indisponível: timeout/);
});

test('se um microsserviço falhar, o erro sobe (a agregação não mascara dado principal)', async () => {
  const quebrado = { pesquisar: async () => { throw new Error('mongo fora'); } };
  const funcao = { calcularRisco: async () => ({ geradoEm: '', resumo: {}, pedidos: [] }) };
  await assert.rejects(new ObterDadosAgregadosCasoDeUso(quebrado, servicoDeFrota, funcao).executar(), /mongo fora/);
});
