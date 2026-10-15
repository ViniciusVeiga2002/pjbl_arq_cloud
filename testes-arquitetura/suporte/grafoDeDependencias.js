// Utilitário dos testes de arquitetura: lê o código-fonte REAL do projeto e
// extrai, de cada arquivo, as dependências declaradas (require, import e
// import dinâmico). As regras de arquitetura são verificadas sobre esse
// grafo — se alguém quebrar uma regra no código, o teste falha.
//
// Sem dependências externas (mesma ideia do ArchUnit, em ~100 linhas).
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..', '..');
const PASTAS_IGNORADAS = new Set(['node_modules', 'dist', '.git']);

function caminhoDoProjeto(...partes) {
  return path.join(RAIZ, ...partes);
}

function relativo(arquivo) {
  return path.relative(RAIZ, arquivo).split(path.sep).join('/');
}

function listarArquivos(pasta, extensoes = ['.js', '.jsx']) {
  if (!fs.existsSync(pasta)) return [];
  const encontrados = [];
  for (const entrada of fs.readdirSync(pasta, { withFileTypes: true })) {
    if (PASTAS_IGNORADAS.has(entrada.name)) continue;
    const caminho = path.join(pasta, entrada.name);
    if (entrada.isDirectory()) encontrados.push(...listarArquivos(caminho, extensoes));
    else if (extensoes.includes(path.extname(entrada.name))) encontrados.push(caminho);
  }
  return encontrados.sort();
}

// Remove comentários de bloco e de linha inteira, para que um caminho citado
// num comentário não seja confundido com uma dependência real.
function semComentarios(codigo) {
  return codigo
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((linha) => !linha.trim().startsWith('//'))
    .join('\n');
}

function lerCodigo(arquivo) {
  return semComentarios(fs.readFileSync(arquivo, 'utf8'));
}

const PADROES_DE_IMPORTACAO = [
  /require\(\s*['"]([^'"]+)['"]\s*\)/g,
  /^\s*import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/gm,
  /import\(\s*['"]([^'"]+)['"]\s*\)/g,
];

function resolverRelativo(origem, especificador) {
  const base = path.resolve(path.dirname(origem), especificador);
  for (const candidato of [base, `${base}.js`, `${base}.jsx`, path.join(base, 'index.js')]) {
    if (fs.existsSync(candidato) && fs.statSync(candidato).isFile()) return candidato;
  }
  return base;
}

// "@azure/functions/x" → "@azure/functions"; "mongodb" → "mongodb";
// "node:crypto" → "node:crypto"; "mfePedidos/TelaPedidos" → "mfePedidos".
function nomeDoPacote(especificador) {
  const partes = especificador.split('/');
  return especificador.startsWith('@') ? partes.slice(0, 2).join('/') : partes[0];
}

// [{ especificador, arquivo (caminho absoluto, se relativo), pacote (se externo) }]
function dependenciasDe(arquivo) {
  const codigo = lerCodigo(arquivo);
  const dependencias = [];
  for (const padrao of PADROES_DE_IMPORTACAO) {
    for (const [, especificador] of codigo.matchAll(padrao)) {
      const ehRelativo = especificador.startsWith('.');
      dependencias.push({
        especificador,
        arquivo: ehRelativo ? resolverRelativo(arquivo, especificador) : null,
        pacote: ehRelativo ? null : nomeDoPacote(especificador),
      });
    }
  }
  return dependencias;
}

// Percorre todos os arquivos e devolve as violações encontradas pela regra.
// "regra(arquivo, dependencia)" devolve uma mensagem quando a dependência é
// proibida, ou null quando é permitida.
function encontrarViolacoes(arquivos, regra) {
  const violacoes = [];
  for (const arquivo of arquivos) {
    for (const dependencia of dependenciasDe(arquivo)) {
      const motivo = regra(arquivo, dependencia);
      if (motivo) violacoes.push(`${relativo(arquivo)} → ${dependencia.especificador}: ${motivo}`);
    }
  }
  return violacoes;
}

function estaDentro(arquivo, pasta) {
  const rel = path.relative(pasta, arquivo);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

module.exports = {
  RAIZ,
  caminhoDoProjeto,
  relativo,
  listarArquivos,
  lerCodigo,
  dependenciasDe,
  encontrarViolacoes,
  estaDentro,
};
