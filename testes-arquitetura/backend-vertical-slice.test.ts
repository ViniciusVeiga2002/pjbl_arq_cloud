import test from 'node:test';
import assert from 'node:assert/strict';
import { projectFiles } from 'archunit';
import {
  PROJETOS_DE_BACKEND,
  pastaDaCamada,
  projetosComCamada,
  sliceDe,
  tsconfigDoBackend,
  verificar,
  type ProjetoDeBackend,
} from './suporte/arquitetura';

// VERTICAL SLICE — o código é organizado por caso de uso
// (features/<area>/<slice>/), e cada fatia é independente das outras: mudar
// um caso de uso não exige tocar em outro.

// Fatias que DEVEM existir: se uma for renomeada ou removida, a
// documentação de arquitetura também precisa mudar.
const FATIAS_ESPERADAS: Record<ProjetoDeBackend, string[]> = {
  gateway: ['documentacao/swagger', 'roteamento/encaminhar-requisicao'],
  'bff-web': [
    'agregacao/obter-dados-agregados',
    'documentacao/swagger',
    'painel/obter-painel-frota',
    'pedidos/alterar-pedido',
    'pedidos/cadastrar-pedido',
    'pedidos/concluir-entrega',
    'pedidos/excluir-pedido',
    'pedidos/pesquisar-pedidos',
  ],
  'servico-pedidos': [
    'documentacao/swagger',
    'pedidos/alterar-pedido',
    'pedidos/cadastrar-pedido',
    'pedidos/excluir-pedido',
    'pedidos/pesquisar-pedidos',
  ],
  'servico-frota': [
    'documentacao/swagger',
    'entregas/atualizar-projecao-de-entrega',
    'entregas/listar-entregas',
    'veiculos/listar-veiculos',
    'veiculos/registrar-telemetria',
  ],
  'funcao-enriquecimento': ['documentacao/swagger', 'enriquecimento/calcular-risco'],
};

const arquivos = (projeto: ProjetoDeBackend) => projectFiles(tsconfigDoBackend(projeto));

// Inventário das fatias (fatia → nomes dos arquivos), montado a partir dos
// arquivos que o ArchUnitTS enxerga em features/.
async function inventarioDeFatias(projeto: ProjetoDeBackend): Promise<Map<string, string[]>> {
  const inventario = new Map<string, string[]>();
  await arquivos(projeto)
    .inFolder(pastaDaCamada('features'))
    .should()
    .adhereTo((arquivo) => {
      const fatia = sliceDe(arquivo.path);
      if (fatia) inventario.set(fatia, [...(inventario.get(fatia) ?? []), arquivo.name]);
      return true;
    }, 'inventário das fatias')
    .check();
  return inventario;
}

for (const projeto of PROJETOS_DE_BACKEND) {
  test(`[${projeto}] as fatias verticais existentes são exatamente as documentadas`, async () => {
    const fatias = [...(await inventarioDeFatias(projeto)).keys()].sort();
    assert.deepEqual(fatias, [...FATIAS_ESPERADAS[projeto]].sort());
  });

  test(`[${projeto}] todo arquivo de features/ está dentro de uma fatia (features/<area>/<slice>/)`, async () => {
    await verificar(
      arquivos(projeto)
        .inFolder(pastaDaCamada('features'))
        .should()
        .adhereTo((arquivo) => sliceDe(arquivo.path) !== null, 'arquivo de features/ fora de uma fatia <area>/<slice>')
    );
  });

  test(`[${projeto}] cada fatia tem um adaptador de entrada (*Function.ts) e um caso de uso (*CasoDeUso.ts; a fatia de documentação não tem caso de uso)`, async () => {
    for (const [fatia, nomes] of await inventarioDeFatias(projeto)) {
      assert.equal(nomes.filter((n) => n.endsWith('Function')).length, 1, `${fatia}: deve ter 1 *Function.ts`);
      // Fatia de documentação (Swagger): só serve a especificação, sem regra de negócio.
      const casosDeUsoEsperados = fatia.startsWith('documentacao/') ? 0 : 1;
      assert.equal(nomes.filter((n) => n.endsWith('CasoDeUso')).length, casosDeUsoEsperados, `${fatia}: deve ter ${casosDeUsoEsperados} *CasoDeUso.ts`);
    }
  });

  test(`[${projeto}] uma fatia não importa código de outra fatia`, async () => {
    const fatias = [...(await inventarioDeFatias(projeto)).keys()];
    for (const fatia of fatias) {
      for (const outra of fatias.filter((f) => f !== fatia)) {
        await verificar(
          arquivos(projeto)
            .inFolder(`src/features/${fatia}/**`)
            .shouldNot()
            .dependOnFiles()
            .inFolder(`src/features/${outra}/**`)
        );
      }
    }
  });

  test(`[${projeto}] nada fora de features/ depende de uma fatia, exceto o Composition Root`, async () => {
    const camadasCompartilhadas = (['dominio', 'aplicacao', 'infraestrutura'] as const).filter((camada) =>
      projetosComCamada(camada).includes(projeto)
    );
    for (const camada of camadasCompartilhadas) {
      await verificar(
        arquivos(projeto).inFolder(pastaDaCamada(camada)).shouldNot().dependOnFiles().inFolder(pastaDaCamada('features'))
      );
    }
  });
}
