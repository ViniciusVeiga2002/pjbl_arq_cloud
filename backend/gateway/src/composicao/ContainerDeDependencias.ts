import LimitadorDeRequisicoes from '../dominio/LimitadorDeRequisicoes';
import PoliticaDeCors from '../dominio/PoliticaDeCors';
import { criarEncaminhadorHttp } from '../infraestrutura/clientes/EncaminhadorHttp';
import EncaminharRequisicaoCasoDeUso from '../features/roteamento/encaminhar-requisicao/EncaminharRequisicaoCasoDeUso';

// Composition Root do API Gateway. O limitador e a política de CORS são
// criados UMA vez por instância (o limitador precisa lembrar as contagens
// entre invocações); o caso de uso é criado a cada requisição.
const ORIGENS_PADRAO = [
  'https://kind-water-063145a0f.7.azurestaticapps.net',
  'http://localhost:5173',
  'http://localhost:4173',
];

const limitador = new LimitadorDeRequisicoes({
  limite: Number(process.env.LIMITE_REQUISICOES_POR_MINUTO || 120),
  janelaMs: 60_000,
});

const politicaDeCors = new PoliticaDeCors(
  process.env.ORIGENS_PERMITIDAS ? process.env.ORIGENS_PERMITIDAS.split(',').map((o) => o.trim()) : ORIGENS_PADRAO
);

export const criarEncaminharRequisicaoCasoDeUso = () => new EncaminharRequisicaoCasoDeUso(criarEncaminhadorHttp(), limitador);
export const obterPoliticaDeCors = () => politicaDeCors;
