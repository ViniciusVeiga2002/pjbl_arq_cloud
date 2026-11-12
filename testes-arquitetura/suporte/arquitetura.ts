// Apoio dos testes de arquitetura. As regras em si são escritas com o
// ArchUnitTS (projectFiles(...).inFolder(...).shouldNot().dependOnFiles()...);
// este módulo só reúne o que elas têm em comum: onde está cada projeto, como
// transformar violações em mensagens legíveis e um leitor de importações para
// as regras que precisam olhar bibliotecas externas (o grafo do ArchUnitTS só
// liga arquivos do próprio projeto).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { CheckOptions, CustomFileCondition, FileInfo } from 'archunit';

export const RAIZ = path.resolve(__dirname, '..', '..');

export const PROJETOS_DE_BACKEND = ['gateway', 'bff-web', 'servico-pedidos', 'servico-frota', 'funcao-enriquecimento'] as const;
export const MICROSSERVICOS = ['servico-pedidos', 'servico-frota'] as const;
export type ProjetoDeBackend = (typeof PROJETOS_DE_BACKEND)[number];

export const caminhoDoProjeto = (...partes: string[]): string => path.join(RAIZ, ...partes);
export const pastaDoProjeto = (projeto: ProjetoDeBackend): string => caminhoDoProjeto('backend', projeto);
export const lerTexto = (...partes: string[]): string => fs.readFileSync(caminhoDoProjeto(...partes), 'utf8');

// Cada tsconfig define um "projeto" para o ArchUnitTS; os padrões das regras
// (inFolder, withName...) são relativos à pasta do tsconfig.
//  - backend/<projeto>/tsconfig.json : um microsserviço/BFF/gateway ("src/dominio/**")
//  - backend/tsconfig.json           : os quatro juntos ("gateway/src/**"), para regras entre projetos
//  - frontend/tsconfig.json          : shell + microfrontends ("shell/**", "mfe-frota/**")
export const tsconfigDoBackend = (projeto: ProjetoDeBackend): string => caminhoDoProjeto('backend', projeto, 'tsconfig.json');
export const TSCONFIG_DO_BACKEND = caminhoDoProjeto('backend', 'tsconfig.json');
export const TSCONFIG_DO_FRONTEND = caminhoDoProjeto('frontend', 'tsconfig.json');

// Camadas do backend, pela pasta (todos os projetos seguem a mesma organização).
export type Camada = 'dominio' | 'aplicacao' | 'features' | 'infraestrutura' | 'composicao';
export const pastaDaCamada = (camada: Camada): string => `src/${camada}/**`;

export function projetosComCamada(camada: Camada): ProjetoDeBackend[] {
  return PROJETOS_DE_BACKEND.filter((projeto) => fs.existsSync(path.join(pastaDoProjeto(projeto), 'src', camada)));
}

// Adaptador de entrada = Azure Function (arquivos *Function.ts em features/).
export const ADAPTADOR_DE_ENTRADA = /Function(\.ts)?$/;
export const CASO_DE_USO = /CasoDeUso(\.ts)?$/;
export const NAO_E_ADAPTADOR_DE_ENTRADA = /^(?!.*Function(\.ts)?$)/;
export const ehAdaptadorDeEntrada = (arquivo: FileInfo): boolean => /Function$/.test(arquivo.name);

// Adaptadores de SAÍDA: falam com banco, fila ou outros serviços. Só o
// Composition Root pode conhecê-los.
const ADAPTADORES_DE_SAIDA = [
  { pasta: 'persistencia', prefixo: '', padrao: /src\/infraestrutura\/persistencia\// },
  { pasta: 'clientes', prefixo: '', padrao: /src\/infraestrutura\/clientes\// },
  { pasta: 'mensageria', prefixo: 'Publicador', padrao: /src\/infraestrutura\/mensageria\/Publicador/ },
] as const;

// Padrões de caminho dos adaptadores de saída que o projeto de fato possui
// (nem todo projeto tem banco, fila e clientes HTTP).
export function adaptadoresDeSaidaDe(projeto: ProjetoDeBackend): RegExp[] {
  return ADAPTADORES_DE_SAIDA.filter(({ pasta, prefixo }) => {
    const dir = path.join(pastaDoProjeto(projeto), 'src', 'infraestrutura', pasta);
    return fs.existsSync(dir) && fs.readdirSync(dir).some((nome) => nome.startsWith(prefixo));
  }).map(({ padrao }) => padrao);
}

// ---------------------------------------------------------------------------
// Violações → mensagens

interface Checavel {
  check(options?: CheckOptions): Promise<unknown[]>;
}

function descrever(violacao: unknown): string {
  const v = violacao as {
    dependency?: { sourceLabel: string; targetLabel: string };
    cycle?: { source: string; target: string }[];
    fileInfo?: { path: string };
    message?: string;
  };
  if (v.dependency) return `${v.dependency.sourceLabel} → ${v.dependency.targetLabel}`;
  if (v.cycle) return `ciclo: ${v.cycle.map((aresta) => aresta.source).join(' → ')}`;
  if (v.fileInfo) return `${v.fileInfo.path}: ${v.message}`;
  return v.message ?? JSON.stringify(violacao);
}

// Executa a regra e falha listando cada violação. Por padrão uma regra cujo
// padrão de pasta não encontra nenhum arquivo também falha (o ArchUnitTS trata
// como "teste vazio"), o que evita regras que passam sem verificar nada.
export async function verificar(regra: Checavel, opcoes: CheckOptions = {}): Promise<void> {
  const violacoes = await regra.check(opcoes);
  assert.deepEqual(violacoes.map(descrever), []);
}

// ---------------------------------------------------------------------------
// Leitura de código-fonte (para regras sobre bibliotecas e textos)

// Condição para .adhereTo(...) que recebe o CÓDIGO do arquivo. O FileInfo.content
// do ArchUnitTS lê o arquivo relativo ao diretório atual do processo e, fora da
// pasta do tsconfig, chega vazio — o que faria qualquer regra de conteúdo passar
// sem verificar nada. Aqui o arquivo é lido a partir da pasta do tsconfig, e um
// arquivo ilegível derruba o teste em vez de passar em silêncio.
export function condicao(tsconfig: string, regra: (codigo: string, arquivo: FileInfo) => boolean): CustomFileCondition {
  const raiz = path.dirname(tsconfig);
  return (arquivo) => {
    const codigo = fs.readFileSync(path.join(raiz, arquivo.path), 'utf8');
    assert.ok(codigo.length > 0, `${arquivo.path} está vazio`);
    return regra(codigo, arquivo);
  };
}

// Remove comentários de bloco e de linha inteira, para que um nome citado num
// comentário não seja confundido com uso real.
export function semComentarios(codigo: string): string {
  return codigo
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((linha) => !linha.trim().startsWith('//'))
    .join('\n');
}

export interface Importacao {
  especificador: string;
  apenasTipos: boolean;
}

const PADROES_DE_IMPORTACAO: { regex: RegExp; grupoDoEspecificador: number; grupoDeTipo?: number }[] = [
  // import X from 'x' · import { a } from 'x' · import type { T } from 'x' · import 'x'
  { regex: /^\s*import\s+(type\s+)?(?:[^;'"]*?\s+from\s+)?['"]([^'"]+)['"]/gm, grupoDoEspecificador: 2, grupoDeTipo: 1 },
  // export { a } from 'x' · export * from 'x'
  { regex: /^\s*export\s+(type\s+)?[^;'"]*?\s+from\s+['"]([^'"]+)['"]/gm, grupoDoEspecificador: 2, grupoDeTipo: 1 },
  // import('x') · require('x')
  { regex: /\b(?:import|require)\(\s*['"]([^'"]+)['"]\s*\)/g, grupoDoEspecificador: 1 },
];

export function importacoesDe(codigo: string): Importacao[] {
  const limpo = semComentarios(codigo);
  const importacoes: Importacao[] = [];
  for (const { regex, grupoDoEspecificador, grupoDeTipo } of PADROES_DE_IMPORTACAO) {
    for (const achado of limpo.matchAll(regex)) {
      importacoes.push({
        especificador: achado[grupoDoEspecificador],
        apenasTipos: grupoDeTipo !== undefined && Boolean(achado[grupoDeTipo]),
      });
    }
  }
  return importacoes;
}

// "@azure/functions/x" → "@azure/functions"; "mongodb" → "mongodb"; "node:crypto" → "node:crypto".
export function nomeDoPacote(especificador: string): string {
  const partes = especificador.split('/');
  return especificador.startsWith('@') ? partes.slice(0, 2).join('/') : partes[0];
}

export const ehPacoteExterno = (i: Importacao): boolean => !i.especificador.startsWith('.');

export function pacotesExternosDe(codigo: string, { incluirTipos = true } = {}): string[] {
  return importacoesDe(codigo)
    .filter(ehPacoteExterno)
    .filter((i) => incluirTipos || !i.apenasTipos)
    .map((i) => nomeDoPacote(i.especificador));
}

// features/<area>/<slice>/arquivo.ts → "<area>/<slice>"
export function sliceDe(caminho: string): string | null {
  const achado = caminho.match(/^src\/features\/([^/]+)\/([^/]+)\/[^/]+$/);
  return achado ? `${achado[1]}/${achado[2]}` : null;
}
