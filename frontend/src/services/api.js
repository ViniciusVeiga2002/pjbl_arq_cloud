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
 * RF05/RF07 - Pesquisar pedidos (lista completa ou filtrada).
 * GET /api/pedidos[?cliente=&status=&entregaId=&id=]
 *
 * Uma das 4 Azure Functions de CRUD ligadas ao MongoDB Atlas (ver
 * GUIA_MONGODB_CRUD.md). Se a chamada falhar (Function fora do ar, ou
 * MONGODB_URI ainda não configurada), cai para um mock local — assim a
 * tela nunca fica quebrada durante o desenvolvimento/demonstração.
 */
export async function getPedidos(filtros = {}) {
  try {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filtros).filter(([, v]) => v))
    );
    const url = `${API_BASE_URL}/pedidos${params.toString() ? `?${params}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[api] Falha ao pesquisar pedidos na Azure Function, usando mock local.', err);
    return filtrarPedidosFallback(filtros);
  }
}

/**
 * RF05/RF07 - Inserir pedido.
 * POST /api/pedidos
 */
export async function criarPedido(pedido) {
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[api] Falha ao inserir pedido na Azure Function, salvando só localmente.', err);
    const novo = {
      id: `PED-LOCAL-${Date.now().toString().slice(-4)}`,
      status: 'Aguardando coleta',
      ...pedido,
    };
    pedidosFallback = [novo, ...pedidosFallback];
    return novo;
  }
}

/**
 * RF05/RF07 - Alterar pedido.
 * PUT /api/pedidos/{id}
 */
export async function atualizarPedido(id, dados) {
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[api] Falha ao alterar pedido na Azure Function, alterando só localmente.', err);
    pedidosFallback = pedidosFallback.map((p) => (p.id === id ? { ...p, ...dados } : p));
    return pedidosFallback.find((p) => p.id === id);
  }
}

/**
 * RF05/RF07 - Excluir pedido.
 * DELETE /api/pedidos/{id}
 */
export async function excluirPedido(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[api] Falha ao excluir pedido na Azure Function, removendo só localmente.', err);
    pedidosFallback = pedidosFallback.filter((p) => p.id !== id);
    return { sucesso: true, id };
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

// Estado local usado só como fallback quando a Azure Function/MongoDB não
// está acessível — nunca é a fonte de dados real. Existe para as telas
// não travarem durante o desenvolvimento antes do MONGODB_URI estar
// configurado, ou numa demonstração sem internet.
let pedidosFallback = getPedidosMockLocal();

function filtrarPedidosFallback(filtros) {
  return pedidosFallback.filter((p) => {
    if (filtros.id && p.id !== filtros.id) return false;
    if (filtros.entregaId && p.entregaId !== filtros.entregaId) return false;
    if (filtros.status && p.status !== filtros.status) return false;
    if (filtros.cliente && !p.cliente.toLowerCase().includes(filtros.cliente.toLowerCase())) return false;
    return true;
  });
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
