// src/services/api.js
//
// Camada única de acesso a dados do frontend.
// Todas as chamadas ao backend (Azure Functions) passam por aqui.
//
// Requisito da atividade: comunicação do frontend com pelo menos 1 endpoint
// GET de Azure Functions, usando dados mock.
//
// A URL da function fica em uma variável de ambiente do Vite
// (VITE_API_BASE_URL), configurada em um arquivo .env.local que NÃO vai
// para o Git (veja .env.example). Assim, cada integrante do grupo pode
// apontar para a sua própria Function local, e em produção o valor real
// é configurado como "Application setting" no Azure Static Web Apps.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * RF07 - Lista de pedidos por entrega.
 * GET /api/pedidos
 *
 * Busca a lista de pedidos vinculados às entregas em andamento na Azure
 * Function. Se a chamada falhar (ex.: function ainda não publicada, ou
 * rodando sem "npm run dev" na pasta api/), cai para um mock local — assim
 * a tela nunca fica quebrada durante o desenvolvimento/demonstração.
 */
export async function getPedidos() {
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[api] Falha ao buscar /pedidos na Azure Function, usando mock local.', err);
    return getPedidosMockLocal();
  }
}

/**
 * RF06 - Mapa em tempo real da frota.
 * Nesta entrega os dados de posição também são mockados (poderiam vir de
 * outro endpoint GET da mesma Function App, ex.: /api/veiculos).
 * Deixamos como função async para já simular a mesma "forma" de uma
 * chamada real e facilitar a troca por fetch(`${API_BASE_URL}/veiculos`)
 * no futuro.
 */
export async function getVeiculos() {
  await new Promise((resolve) => setTimeout(resolve, 250)); // simula latência de rede
  return getVeiculosMockLocal();
}

function getPedidosMockLocal() {
  return [
    {
      id: 'PED-1042',
      cliente: 'Distribuidora Norte Ltda',
      entregaId: 'ENT-501',
      veiculoPlaca: 'ABC-1D23',
      status: 'Em rota',
      previsaoEntrega: '2026-08-27T18:00:00',
    },
    {
      id: 'PED-1043',
      cliente: 'Mercado Bom Preço',
      entregaId: 'ENT-501',
      veiculoPlaca: 'ABC-1D23',
      status: 'Em rota',
      previsaoEntrega: '2026-08-27T19:30:00',
    },
    {
      id: 'PED-1050',
      cliente: 'Auto Peças Silva',
      entregaId: 'ENT-502',
      veiculoPlaca: 'DEF-4G56',
      status: 'Entregue',
      previsaoEntrega: '2026-08-27T14:00:00',
    },
    {
      id: 'PED-1051',
      cliente: 'Construtora Horizonte',
      entregaId: 'ENT-503',
      veiculoPlaca: 'GHI-7J89',
      status: 'Atrasado',
      previsaoEntrega: '2026-08-27T11:00:00',
    },
  ];
}

function getVeiculosMockLocal() {
  return [
    { placa: 'ABC-1D23', motorista: 'Juliana Ferreira', lat: -23.5505, lng: -46.6333, velocidade: 62, status: 'ok' },
    { placa: 'DEF-4G56', motorista: 'Carlos Souza', lat: -23.5629, lng: -46.6544, velocidade: 0, status: 'parado' },
    { placa: 'GHI-7J89', motorista: 'Marcos Pereira', lat: -23.5330, lng: -46.6220, velocidade: 98, status: 'alerta-velocidade' },
  ];
}
