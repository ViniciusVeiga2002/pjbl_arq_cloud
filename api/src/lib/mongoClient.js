const { MongoClient } = require('mongodb');

// Conexão compartilhada com o MongoDB Atlas.
//
// Em Azure Functions (ambiente serverless), a mesma instância do processo
// Node pode atender várias invocações seguidas — por isso reaproveitamos
// (cacheamos) a Promise de conexão em vez de abrir uma conexão nova a cada
// chamada, que é a prática recomendada pela própria documentação da
// Microsoft para bancos externos em Functions.
//
// MONGODB_URI e MONGODB_DB vêm de variáveis de ambiente:
// - localmente: api/local.settings.json (copiado de local.settings.json.example)
// - em produção: Azure Portal → Static Web App → Configuração → Application settings
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'pjbl_telemetria';

let cachedClientPromise = null;

function getClientPromise() {
  if (!MONGODB_URI) {
    throw new Error(
      'Variável de ambiente MONGODB_URI não configurada. Veja api/local.settings.json.example ' +
      'e a seção do MongoDB Atlas no guia da atividade.'
    );
  }
  if (!cachedClientPromise) {
    const client = new MongoClient(MONGODB_URI);
    cachedClientPromise = client.connect();
  }
  return cachedClientPromise;
}

// Coleção "pedidos" usada pelas 4 Azure Functions de CRUD (RF05/RF07).
async function getPedidosCollection() {
  const client = await getClientPromise();
  return client.db(MONGODB_DB).collection('pedidos');
}

module.exports = { getPedidosCollection };
