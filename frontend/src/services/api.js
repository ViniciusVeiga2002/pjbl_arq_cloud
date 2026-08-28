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

// Mock Server do Apidog (ver GUIA_PASSO_A_PASSO.md, seção 8) — usado para
// endpoints que a atividade não exige como Azure Function (GET de veículos
// e a ação de concluir entrega). Se a variável não estiver configurada em
// .env.local, essas funções caem direto no mock local abaixo.
const APIDOG_BASE_URL = import.meta.env.VITE_APIDOG_BASE_URL || '';

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
 * Busca a posição dos veículos no Mock Server do Apidog. Se a URL não
 * estiver configurada (VITE_APIDOG_BASE_URL) ou a chamada falhar, cai para
 * o mock local — mesma estratégia usada em getPedidos() para a Function.
 */
export async function getVeiculos() {
  if (!APIDOG_BASE_URL) return getVeiculosMockLocal();

  try {
    const res = await fetch(`${APIDOG_BASE_URL}/veiculos`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[api] Falha ao buscar /veiculos no Apidog, usando mock local.', err);
    return getVeiculosMockLocal();
  }
}

/**
 * RF10 - Marca uma entrega como concluída.
 * POST no Mock Server do Apidog. Se a URL não estiver configurada ou a
 * chamada falhar, simula sucesso localmente (sem persistir nada) para a
 * demonstração não travar.
 */
export async function concluirEntrega(entregaId) {
  if (!APIDOG_BASE_URL) return concluirEntregaMockLocal(entregaId);

  try {
    const res = await fetch(`${APIDOG_BASE_URL}/entregas/${entregaId}/concluir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concluidoEm: new Date().toISOString() }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[api] Falha ao concluir entrega no Apidog, simulando localmente.', err);
    return concluirEntregaMockLocal(entregaId);
  }
}

function concluirEntregaMockLocal(entregaId) {
  return { sucesso: true, entregaId, status: 'Entregue', concluidoEm: new Date().toISOString() };
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
