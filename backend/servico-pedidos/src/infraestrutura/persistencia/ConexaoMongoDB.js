const { MongoClient } = require('mongodb');

// Conexão compartilhada com o MongoDB Atlas (antigo api/src/lib/mongoClient.js,
// movido para a camada de infraestrutura sem alterar o comportamento).
//
// Em Azure Functions (ambiente serverless), a mesma instância do processo
// Node pode atender várias invocações seguidas — por isso reaproveitamos
// (cacheamos) a Promise de conexão em vez de abrir uma conexão nova a cada
// chamada, que é a prática recomendada pela própria documentação da
// Microsoft para bancos externos em Functions.
//
// Database per Service: o banco "pjbl_pedidos" pertence EXCLUSIVAMENTE a
// este microsserviço. Nenhum outro serviço lê ou grava nele — o
// servico-frota fica sabendo das mudanças de pedidos pelos eventos da fila
// "pedidos-eventos", e o BFF só conversa com este serviço por HTTP.
//
// MONGODB_URI e MONGODB_DB vêm de variáveis de ambiente:
// - localmente: local.settings.json (copiado de local.settings.json.example)
// - em produção: Application settings do Function App do serviço de pedidos
const MONGODB_DB_PADRAO = 'pjbl_pedidos';

let cachedClientPromise = null;

function obterPromiseDeConexao() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'Variável de ambiente MONGODB_URI não configurada. Veja local.settings.json.example.'
    );
  }
  if (!cachedClientPromise) {
    const client = new MongoClient(uri);
    cachedClientPromise = client.connect();
  }
  return cachedClientPromise;
}

// Coleção "pedidos" usada pelos repositórios da camada de infraestrutura
// (infraestrutura/persistencia/RepositorioDePedidosMongo.js).
async function obterColecaoDePedidos() {
  const client = await obterPromiseDeConexao();
  const nomeBanco = process.env.MONGODB_DB || MONGODB_DB_PADRAO;
  return client.db(nomeBanco).collection('pedidos');
}

module.exports = { obterColecaoDePedidos };
