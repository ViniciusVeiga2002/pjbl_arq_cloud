// Mapa das camadas do backend, usado pelas regras de arquitetura. Todos os
// projetos de backend (gateway, BFF e microsserviços) seguem a mesma
// organização: dominio/ · aplicacao/ · features/<area>/<slice>/ ·
// infraestrutura/ · composicao/.
const path = require('node:path');
const { caminhoDoProjeto, listarArquivos, estaDentro } = require('./grafoDeDependencias');

const PROJETOS_DE_BACKEND = Object.freeze(['gateway', 'bff-web', 'servico-pedidos', 'servico-frota']);
const MICROSSERVICOS = Object.freeze(['servico-pedidos', 'servico-frota']);

function pastaDoProjeto(projeto) {
  return caminhoDoProjeto('backend', projeto);
}

function pastaFonte(projeto, ...partes) {
  return path.join(pastaDoProjeto(projeto), 'src', ...partes);
}

function arquivosFonte(projeto) {
  return listarArquivos(pastaFonte(projeto));
}

function ehAdaptadorDeEntrada(arquivo) {
  return /Function\.js$/.test(arquivo);
}

// Camada de cada arquivo, pela pasta onde ele está.
function camadaDe(projeto, arquivo) {
  if (estaDentro(arquivo, pastaFonte(projeto, 'dominio'))) return 'dominio';
  if (estaDentro(arquivo, pastaFonte(projeto, 'aplicacao'))) return 'aplicacao';
  if (estaDentro(arquivo, pastaFonte(projeto, 'features'))) {
    return ehAdaptadorDeEntrada(arquivo) ? 'entrada' : 'aplicacao';
  }
  if (estaDentro(arquivo, pastaFonte(projeto, 'infraestrutura'))) return 'infraestrutura';
  if (estaDentro(arquivo, pastaFonte(projeto, 'composicao'))) return 'composicao';
  return 'fora';
}

// Adaptadores de SAÍDA: falam com banco, fila ou outros serviços. Só o
// Composition Root pode conhecê-los.
function ehAdaptadorDeSaida(projeto, arquivo) {
  const infra = pastaFonte(projeto, 'infraestrutura');
  return (
    estaDentro(arquivo, path.join(infra, 'persistencia')) ||
    estaDentro(arquivo, path.join(infra, 'clientes')) ||
    (estaDentro(arquivo, path.join(infra, 'mensageria')) && /Publicador/.test(path.basename(arquivo)))
  );
}

// features/<area>/<slice>/arquivo.js → "<area>/<slice>"
function sliceDe(projeto, arquivo) {
  const rel = path.relative(pastaFonte(projeto, 'features'), arquivo).split(path.sep);
  return rel.length >= 3 && !rel[0].startsWith('..') ? `${rel[0]}/${rel[1]}` : null;
}

function slicesDo(projeto) {
  const slices = new Set();
  for (const arquivo of arquivosFonte(projeto)) {
    const slice = sliceDe(projeto, arquivo);
    if (slice) slices.add(slice);
  }
  return [...slices].sort();
}

module.exports = {
  PROJETOS_DE_BACKEND,
  MICROSSERVICOS,
  pastaDoProjeto,
  pastaFonte,
  arquivosFonte,
  camadaDe,
  ehAdaptadorDeEntrada,
  ehAdaptadorDeSaida,
  sliceDe,
  slicesDo,
};
