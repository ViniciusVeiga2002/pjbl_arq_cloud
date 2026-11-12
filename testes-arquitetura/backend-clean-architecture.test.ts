import test from 'node:test';
import { projectFiles } from 'archunit';
import {
  ADAPTADOR_DE_ENTRADA,
  adaptadoresDeSaidaDe,
  CASO_DE_USO,
  NAO_E_ADAPTADOR_DE_ENTRADA,
  PROJETOS_DE_BACKEND,
  condicao,
  importacoesDe,
  nomeDoPacote,
  pacotesExternosDe,
  pastaDaCamada,
  projetosComCamada,
  tsconfigDoBackend,
  verificar,
  type Camada,
} from './suporte/arquitetura';

// CLEAN ARCHITECTURE — Regra de Dependência: as dependências de código só
// apontam para DENTRO (entrada/infraestrutura → aplicação → domínio). As
// regras abaixo, escritas com o ArchUnitTS, valem para os quatro projetos de
// backend.

const arquivos = (projeto: (typeof PROJETOS_DE_BACKEND)[number]) => projectFiles(tsconfigDoBackend(projeto));

// Onde cada biblioteca de framework/infraestrutura pode aparecer.
//  - @azure/functions: o registro da Function (app.http/app.storageQueue) é
//    do adaptador de entrada; nas demais camadas só como `import type`.
//  - mongodb e @azure/storage-queue: só na infraestrutura.
const SO_NA_INFRAESTRUTURA = ['mongodb', 'mssql', '@azure/storage-queue'];

for (const projeto of projetosComCamada('dominio')) {
  test(`[${projeto}] o domínio não depende de nenhuma outra camada`, async () => {
    const outrasCamadas: Camada[] = ['aplicacao', 'features', 'infraestrutura', 'composicao'];
    for (const camada of outrasCamadas.filter((c) => projetosComCamada(c).includes(projeto))) {
      await verificar(arquivos(projeto).inFolder(pastaDaCamada('dominio')).shouldNot().dependOnFiles().inFolder(pastaDaCamada(camada)));
    }
  });

  test(`[${projeto}] o domínio não depende de nenhuma biblioteca externa`, async () => {
    await verificar(
      arquivos(projeto)
        .inFolder(pastaDaCamada('dominio'))
        .should()
        .adhereTo(
          condicao(tsconfigDoBackend(projeto), (codigo) => pacotesExternosDe(codigo).length === 0),
          'o domínio não pode importar bibliotecas'
        )
    );
  });
}

for (const projeto of PROJETOS_DE_BACKEND) {
  // "Aplicação" = casos de uso, portas, comandos e filtros dos slices (tudo em
  // features/ que não é Function) mais a camada compartilhada aplicacao/.
  const aplicacao = () => [
    ...(projetosComCamada('aplicacao').includes(projeto) ? [arquivos(projeto).inFolder(pastaDaCamada('aplicacao'))] : []),
    arquivos(projeto).inFolder(pastaDaCamada('features')).withName(NAO_E_ADAPTADOR_DE_ENTRADA),
  ];

  test(`[${projeto}] a aplicação (casos de uso, portas, comandos) só depende de aplicação e domínio`, async () => {
    for (const subjeito of aplicacao()) {
      await verificar(subjeito.shouldNot().dependOnFiles().inFolder(pastaDaCamada('infraestrutura')));
    }
    for (const subjeito of aplicacao()) {
      await verificar(subjeito.shouldNot().dependOnFiles().inFolder(pastaDaCamada('composicao')));
    }
    for (const subjeito of aplicacao()) {
      await verificar(subjeito.shouldNot().dependOnFiles().withName(ADAPTADOR_DE_ENTRADA));
    }
  });

  test(`[${projeto}] a aplicação não depende de frameworks nem de bibliotecas (só de módulos node:)`, async () => {
    for (const subjeito of aplicacao()) {
      await verificar(
        subjeito
          .should()
          .adhereTo(
            condicao(tsconfigDoBackend(projeto), (codigo) => pacotesExternosDe(codigo).every((pacote) => pacote.startsWith('node:'))),
            'a aplicação não pode depender de frameworks'
          )
      );
    }
  });

  test(`[${projeto}] bibliotecas de infraestrutura (mongodb, mssql, storage-queue) só aparecem na infraestrutura`, async () => {
    for (const pacote of SO_NA_INFRAESTRUTURA) {
      for (const camada of ['dominio', 'aplicacao', 'features', 'composicao'] as const) {
        if (!projetosComCamada(camada).includes(projeto)) continue;
        await verificar(
          arquivos(projeto)
            .inFolder(pastaDaCamada(camada))
            .should()
            .adhereTo(
              condicao(tsconfigDoBackend(projeto), (codigo) => !importacoesDe(codigo).some((i) => nomeDoPacote(i.especificador) === pacote)),
              `${pacote} só é permitido na camada infraestrutura`
            )
        );
      }
    }
  });

  test(`[${projeto}] o registro de Functions (@azure/functions) só acontece nos adaptadores de entrada`, async () => {
    await verificar(
      arquivos(projeto)
        .inFolder('src/**')
        .should()
        .adhereTo(
          condicao(
            tsconfigDoBackend(projeto),
            (codigo, arquivo) =>
              ADAPTADOR_DE_ENTRADA.test(arquivo.name) ||
              !importacoesDe(codigo).some((i) => nomeDoPacote(i.especificador) === '@azure/functions' && !i.apenasTipos)
          ),
          '@azure/functions só pode ser importado (como valor) por um *Function.ts'
        )
    );
  });

  test(`[${projeto}] só o Composition Root conhece os adaptadores de saída (banco, fila, HTTP)`, async () => {
    const quemNaoDeveConhecer = [
      arquivos(projeto).inFolder(pastaDaCamada('features')),
      ...(['dominio', 'aplicacao'] as const)
        .filter((camada) => projetosComCamada(camada).includes(projeto))
        .map((camada) => arquivos(projeto).inFolder(pastaDaCamada(camada))),
    ];
    for (const subjeito of quemNaoDeveConhecer) {
      for (const adaptador of adaptadoresDeSaidaDe(projeto)) {
        await verificar(subjeito.shouldNot().dependOnFiles().inPath(adaptador));
      }
    }
  });

  test(`[${projeto}] adaptadores de entrada (*Function.ts) obtêm o caso de uso pelo Composition Root, sem instanciá-lo`, async () => {
    await verificar(
      arquivos(projeto)
        .inFolder(pastaDaCamada('features'))
        .withName(ADAPTADOR_DE_ENTRADA)
        .shouldNot()
        .dependOnFiles()
        .withName(CASO_DE_USO)
    );
  });

  test(`[${projeto}] a infraestrutura não depende dos adaptadores de entrada, do Composition Root nem dos casos de uso`, async () => {
    const infraestrutura = () => arquivos(projeto).inFolder(pastaDaCamada('infraestrutura'));
    await verificar(infraestrutura().shouldNot().dependOnFiles().inFolder(pastaDaCamada('composicao')));
    await verificar(infraestrutura().shouldNot().dependOnFiles().withName(ADAPTADOR_DE_ENTRADA));
    await verificar(infraestrutura().shouldNot().dependOnFiles().withName(CASO_DE_USO));
  });

  test(`[${projeto}] não há dependências circulares no código-fonte`, async () => {
    await verificar(arquivos(projeto).inFolder('src/**').should().haveNoCycles());
  });
}
