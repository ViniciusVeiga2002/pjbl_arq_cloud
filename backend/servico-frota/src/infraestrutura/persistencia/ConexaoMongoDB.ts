import { Collection, Db, Document, MongoClient } from 'mongodb';
import { DadosDaEntrega } from '../../dominio/Entrega';
import { DadosDoVeiculo } from '../../dominio/Veiculo';

// Conexão cacheada com o MongoDB do servico-frota (mesmo padrão serverless
// do servico-pedidos: a Promise de conexão é reaproveitada entre invocações
// na mesma instância do Function App).
//
// Database per Service: o banco "pjbl_frota" pertence EXCLUSIVAMENTE a este
// microsserviço, com usuário próprio no MongoDB (ver guia de recursos do
// Azure). Os dados de pedidos chegam aqui só pelos eventos da fila — nunca
// por consulta ao banco "pjbl_pedidos".
const MONGODB_DB_PADRAO = 'pjbl_frota';

let cachedClientPromise: Promise<MongoClient> | null = null;
let indicesPromise: Promise<unknown> | null = null;

function obterPromiseDeConexao(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Variável de ambiente MONGODB_URI não configurada. Veja local.settings.json.example.');
  }
  if (!cachedClientPromise) {
    cachedClientPromise = new MongoClient(uri).connect();
  }
  return cachedClientPromise;
}

async function obterBanco(): Promise<Db> {
  const client = await obterPromiseDeConexao();
  return client.db(process.env.MONGODB_DB || MONGODB_DB_PADRAO);
}

// Índices únicos criados uma vez por instância: "placa" identifica o
// veículo e "id" a entrega (base do controle de concorrência otimista).
function garantirIndices(banco: Db): Promise<unknown> {
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

async function obterColecao<T extends Document>(nome: string): Promise<Collection<T>> {
  const banco = await obterBanco();
  await garantirIndices(banco);
  return banco.collection<T>(nome);
}

export const obterColecaoDeVeiculos = () => obterColecao<DadosDoVeiculo>('veiculos');
export const obterColecaoDeEntregas = () => obterColecao<DadosDaEntrega>('entregas');
