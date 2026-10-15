const test = require('node:test');
const assert = require('node:assert/strict');
const { encontrarViolacoes } = require('./suporte/grafoDeDependencias');
const {
  PROJETOS_DE_BACKEND,
  arquivosFonte,
  camadaDe,
  ehAdaptadorDeEntrada,
  ehAdaptadorDeSaida,
} = require('./suporte/backend');

// CLEAN ARCHITECTURE — Regra de Dependência: as dependências de código só
// apontam para DENTRO (entrada/infraestrutura → aplicação → domínio). As
// regras abaixo valem para os quatro projetos de backend.

// Bibliotecas de framework e de infraestrutura, e as únicas camadas que
// podem usá-las.
const PACOTES_DE_INFRAESTRUTURA = Object.freeze({
  '@azure/functions': ['entrada'],
  mongodb: ['infraestrutura'],
  '@azure/storage-queue': ['infraestrutura'],
});

for (const projeto of PROJETOS_DE_BACKEND) {
  test(`[${projeto}] o domínio não depende de nenhuma outra camada nem de biblioteca externa`, () => {
    const violacoes = encontrarViolacoes(
      arquivosFonte(projeto).filter((a) => camadaDe(projeto, a) === 'dominio'),
      (_, dep) => {
        if (dep.pacote) return 'o domínio não pode depender de bibliotecas';
        if (camadaDe(projeto, dep.arquivo) !== 'dominio') return 'o domínio só pode depender do próprio domínio';
        return null;
      }
    );
    assert.deepEqual(violacoes, []);
  });

  test(`[${projeto}] a aplicação (casos de uso, portas, comandos) só depende de aplicação e domínio`, () => {
    const violacoes = encontrarViolacoes(
      arquivosFonte(projeto).filter((a) => camadaDe(projeto, a) === 'aplicacao'),
      (_, dep) => {
        if (dep.pacote && !dep.pacote.startsWith('node:')) return 'a aplicação não pode depender de frameworks';
        if (dep.arquivo && !['aplicacao', 'dominio'].includes(camadaDe(projeto, dep.arquivo))) {
          return `a aplicação não pode depender da camada "${camadaDe(projeto, dep.arquivo)}"`;
        }
        return null;
      }
    );
    assert.deepEqual(violacoes, []);
  });

  test(`[${projeto}] bibliotecas de framework/infraestrutura só aparecem na camada permitida`, () => {
    const violacoes = encontrarViolacoes(arquivosFonte(projeto), (arquivo, dep) => {
      const permitidas = PACOTES_DE_INFRAESTRUTURA[dep.pacote];
      const camada = camadaDe(projeto, arquivo);
      return permitidas && !permitidas.includes(camada) ? `${dep.pacote} não é permitido na camada "${camada}"` : null;
    });
    assert.deepEqual(violacoes, []);
  });

  test(`[${projeto}] só o Composition Root conhece os adaptadores de saída (banco, fila, HTTP)`, () => {
    const violacoes = encontrarViolacoes(arquivosFonte(projeto), (arquivo, dep) => {
      if (!dep.arquivo || !ehAdaptadorDeSaida(projeto, dep.arquivo)) return null;
      return ['composicao', 'infraestrutura'].includes(camadaDe(projeto, arquivo))
        ? null
        : 'adaptador de saída usado fora de composicao/ (viola a Inversão de Dependência)';
    });
    assert.deepEqual(violacoes, []);
  });

  test(`[${projeto}] adaptadores de entrada (*Function.js) obtêm o caso de uso pelo Composition Root, sem instanciá-lo`, () => {
    const violacoes = encontrarViolacoes(arquivosFonte(projeto).filter(ehAdaptadorDeEntrada), (_, dep) =>
      dep.arquivo && /CasoDeUso\.js$/.test(dep.arquivo) ? 'importe a fábrica de composicao/ContainerDeDependencias' : null
    );
    assert.deepEqual(violacoes, []);
  });

  test(`[${projeto}] a infraestrutura não depende dos adaptadores de entrada nem dos casos de uso`, () => {
    const violacoes = encontrarViolacoes(
      arquivosFonte(projeto).filter((a) => camadaDe(projeto, a) === 'infraestrutura'),
      (_, dep) => {
        if (!dep.arquivo) return null;
        const camada = camadaDe(projeto, dep.arquivo);
        return ['entrada', 'composicao'].includes(camada) || /CasoDeUso\.js$/.test(dep.arquivo)
          ? `infraestrutura não pode depender de "${camada}"`
          : null;
      }
    );
    assert.deepEqual(violacoes, []);
  });
}
