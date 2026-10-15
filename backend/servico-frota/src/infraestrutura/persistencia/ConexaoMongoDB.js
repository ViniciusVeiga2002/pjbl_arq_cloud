const { MongoClient } = require('mongodb');

// Conexão cacheada com o MongoDB do servico-frota (mesmo padrão serverless
// do servico-pedidos: a Promise de conexão é reaproveitada entre invocações
// na mesma instância do Function App).
//
// Database per Service: o banco "pjbl_frota" pertence EXCLUSIVAMENTE a este
// microsserviço, com usuário próprio no MongoDB (ver guia de recursos do
// Azure). Os dados de pedidos chegam aqui só pelos eventos da fila — nunca
// por consulta ao banco "pjbl_pedidos".
const MONGODB_DB_PADRAO = 'pjbl_frota';

let cachedClientPromise = null;
let indicesPromise = null;

function obterPromiseDeConexao() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Variável de ambiente MONGODB_URI não configurada. Veja local.settings.json.example.');
  }
  if (!cachedClientPromise) {
    cachedClientPromise = new MongoClient(uri).connect();
  }
  return cachedClientPromise;
}

async function obterBanco() {
  const client = await obterPromiseDeConexao();
  return client.db(process.env.MONGODB_DB || MONGODB_DB_PADRAO);
}

// Índices únicos criados uma vez por instância: "placa" identifica o
// veículo e "id" a entrega (base do controle de concorrência otimista).
function garantirIndices(banco) {
  if (!indicesPromise) {
    indicesPromise = Promise.all([
      banco.collection('veiculos').createIndex({ placa: 1 }, { unique: true }),
      banco.collection('entregas').createIndex({ id: 1 }, { unique: true }),
    ]).catch((erro) => {
      indicesPromise = null;
      throw erro;
    });
  }
  return indicesPromise;
}

async function obterColecao(nome) {
  const banco = await obterBanco();
  await garantirIndices(banco);
  return banco.collection(nome);
}

module.exports = {
  obterColecaoDeVeiculos: () => obterColecao('veiculos'),
  obterColecaoDeEntregas: () => obterColecao('entregas'),
};
