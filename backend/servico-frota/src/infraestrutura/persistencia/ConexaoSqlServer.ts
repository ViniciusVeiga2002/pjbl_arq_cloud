import type * as MssqlTipos from 'mssql';

// O pacote "mssql" é carregado só quando o adaptador Azure SQL é usado
// (SQL_CONNECTION_STRING definida). Ele fica em devDependencies para não
// pesar no pacote do Function App, que usa MongoDB por padrão; para ativar o
// Azure SQL em produção, mova "mssql" para "dependencies".
type Mssql = typeof MssqlTipos;
let modulo: Mssql | null = null;
const carregar = (): Mssql => (modulo ??= require('mssql') as Mssql);
const sql = new Proxy({} as Mssql, { get: (_alvo, propriedade) => (carregar() as unknown as Record<string | symbol, unknown>)[propriedade] }) as Mssql;
type ConnectionPool = MssqlTipos.ConnectionPool;

// Conexão cacheada com o Azure SQL Database do servico-frota (mesmo padrão
// serverless dos demais serviços: a Promise do pool é reaproveitada entre
// invocações na mesma instância do Function App).
//
// Database per Service: o banco "pjbl_frota" (Azure SQL) pertence
// EXCLUSIVAMENTE a este microsserviço. Os dados de pedidos chegam aqui só
// pelos eventos da fila — nunca por consulta ao banco do servico-pedidos.
//
// O Azure SQL no plano gratuito/serverless pausa por inatividade: a primeira
// conexão depois da pausa falha com o erro 40613 enquanto o banco "acorda",
// por isso a conexão tem novas tentativas.
const TENTATIVAS = 6;
const ESPERA_MS = 5000;

const SQL_DB_PADRAO = 'pjbl_frota';

let poolPromise: Promise<ConnectionPool> | null = null;
let esquemaPromise: Promise<unknown> | null = null;

const dormir = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function conectarComTentativas(cadeia: string): Promise<ConnectionPool> {
  let ultimoErro: unknown;
  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    try {
      return await new sql.ConnectionPool(cadeia).connect();
    } catch (erro) {
      ultimoErro = erro;
      await dormir(ESPERA_MS);
    }
  }
  throw ultimoErro;
}

function obterPromiseDoPool(): Promise<ConnectionPool> {
  const cadeia = process.env.SQL_CONNECTION_STRING;
  if (!cadeia) {
    throw new Error('Variável de ambiente SQL_CONNECTION_STRING não configurada. Veja local.settings.json.example.');
  }
  if (!poolPromise) {
    poolPromise = conectarComTentativas(cadeia).catch((erro) => {
      poolPromise = null;
      throw erro;
    });
  }
  return poolPromise;
}

// Tabelas criadas uma vez por instância (idempotente): "placa" identifica o
// veículo e "id" a entrega (base do controle de concorrência otimista).
function garantirEsquema(pool: ConnectionPool): Promise<unknown> {
  if (!esquemaPromise) {
    esquemaPromise = pool
      .request()
      .batch(`
        IF OBJECT_ID('dbo.Veiculos', 'U') IS NULL
          CREATE TABLE dbo.Veiculos (
            placa        NVARCHAR(16)  NOT NULL PRIMARY KEY,
            motorista    NVARCHAR(120) NOT NULL,
            lat          FLOAT         NOT NULL,
            lng          FLOAT         NOT NULL,
            velocidade   FLOAT         NOT NULL,
            status       NVARCHAR(40)  NOT NULL,
            registradoEm NVARCHAR(40)  NOT NULL
          );
        IF OBJECT_ID('dbo.Entregas', 'U') IS NULL
          CREATE TABLE dbo.Entregas (
            id           NVARCHAR(64)  NOT NULL PRIMARY KEY,
            veiculoPlaca NVARCHAR(16)  NOT NULL,
            pedidosJson  NVARCHAR(MAX) NOT NULL,
            atualizadoEm NVARCHAR(40)  NULL,
            versao       INT           NOT NULL
          );
      `)
      .catch((erro) => {
        esquemaPromise = null;
        throw erro;
      });
  }
  return esquemaPromise;
}

export const NOME_DO_BANCO = SQL_DB_PADRAO;

export async function obterPool(): Promise<ConnectionPool> {
  const pool = await obterPromiseDoPool();
  await garantirEsquema(pool);
  return pool;
}

export { sql };
