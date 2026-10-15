const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { encontrarViolacoes, listarArquivos } = require('./suporte/grafoDeDependencias');
const { PROJETOS_DE_BACKEND, arquivosFonte, pastaFonte, sliceDe, slicesDo, camadaDe } = require('./suporte/backend');

// VERTICAL SLICE — o código é organizado por caso de uso
// (features/<area>/<slice>/), e cada fatia é independente das outras: mudar
// um caso de uso não exige tocar em outro.

// Fatias que DEVEM existir: se uma for renomeada ou removida, a
// documentação de arquitetura também precisa mudar.
const FATIAS_ESPERADAS = Object.freeze({
  gateway: ['roteamento/encaminhar-requisicao'],
  'bff-web': [
    'painel/obter-painel-frota',
    'pedidos/alterar-pedido',
    'pedidos/cadastrar-pedido',
    'pedidos/concluir-entrega',
    'pedidos/excluir-pedido',
    'pedidos/pesquisar-pedidos',
  ],
  'servico-pedidos': [
    'pedidos/alterar-pedido',
    'pedidos/cadastrar-pedido',
    'pedidos/excluir-pedido',
    'pedidos/pesquisar-pedidos',
  ],
  'servico-frota': [
    'entregas/atualizar-projecao-de-entrega',
    'entregas/listar-entregas',
    'veiculos/listar-veiculos',
    'veiculos/registrar-telemetria',
  ],
});

for (const projeto of PROJETOS_DE_BACKEND) {
  test(`[${projeto}] as fatias verticais existentes são exatamente as documentadas`, () => {
    assert.deepEqual(slicesDo(projeto), [...FATIAS_ESPERADAS[projeto]].sort());
  });

  test(`[${projeto}] cada fatia tem um adaptador de entrada (*Function.js) e um caso de uso (*CasoDeUso.js)`, () => {
    for (const slice of slicesDo(projeto)) {
      const arquivos = listarArquivos(path.join(pastaFonte(projeto, 'features'), slice)).map((a) => path.basename(a));
      assert.equal(arquivos.filter((a) => /Function\.js$/.test(a)).length, 1, `${slice}: deve ter 1 *Function.js`);
      assert.equal(arquivos.filter((a) => /CasoDeUso\.js$/.test(a)).length, 1, `${slice}: deve ter 1 *CasoDeUso.js`);
    }
  });

  test(`[${projeto}] uma fatia não importa código de outra fatia`, () => {
    const violacoes = encontrarViolacoes(
      arquivosFonte(projeto).filter((a) => sliceDe(projeto, a)),
      (arquivo, dep) => {
        if (!dep.arquivo) return null;
        const destino = sliceDe(projeto, dep.arquivo);
        return destino && destino !== sliceDe(projeto, arquivo)
          ? `a fatia "${sliceDe(projeto, arquivo)}" depende da fatia "${destino}"`
          : null;
      }
    );
    assert.deepEqual(violacoes, []);
  });

  test(`[${projeto}] nada fora de features/ depende de uma fatia, exceto o Composition Root`, () => {
    const violacoes = encontrarViolacoes(
      arquivosFonte(projeto).filter((a) => !sliceDe(projeto, a) && camadaDe(projeto, a) !== 'composicao'),
      (_, dep) => (dep.arquivo && sliceDe(projeto, dep.arquivo) ? 'camadas compartilhadas não podem conhecer fatias' : null)
    );
    assert.deepEqual(violacoes, []);
  });
}
