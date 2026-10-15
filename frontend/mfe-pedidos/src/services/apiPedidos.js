// Camada de acesso a dados do mfe-pedidos. Toda chamada vai para o API
// Gateway (rota /web/*, atendida pelo BFF web) — o microfrontend não conhece
// a URL de nenhum microsserviço.
//
// Resiliência (ADR-05 do Arc42): se o gateway falhar, as funções caem para
// um estado local em memória e marcam o modo offline, que a tela exibe num
// aviso visível (antes o fallback era silencioso — risco R05).
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL;
const BASE = `${GATEWAY_URL}/web`;

let offline = false;

export function estaOffline() {
  return offline;
}

async function chamar(caminho, opcoes = {}) {
  const resposta = await fetch(`${BASE}/${caminho}`, {
    ...opcoes,
    headers: { 'content-type': 'application/json', ...opcoes.headers },
  });
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const erro = new Error(corpo?.erro || `HTTP ${resposta.status}`);
    erro.status = resposta.status;
    throw erro;
  }
  offline = false;
  return corpo;
}

// Erro 4xx é resposta legítima do sistema (ex.: validação) e deve chegar à
// tela; só falha de rede/5xx aciona o modo offline.
function ehFalhaDeInfraestrutura(erro) {
  return !erro.status || erro.status >= 500;
}

async function comFallback(operacao, alternativa) {
  try {
    return await operacao();
  } catch (erro) {
    if (!ehFalhaDeInfraestrutura(erro)) throw erro;
    console.warn('[mfe-pedidos] Gateway indisponível, usando dados locais.', erro);
    offline = true;
    return alternativa();
  }
}

/** RF05/RF07 — GET /web/pedidos (pedidos + situação do veículo, montados pelo BFF). */
export function pesquisarPedidos(filtros = {}) {
  const consulta = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v));
  return comFallback(
    () => chamar(`pedidos${consulta.size ? `?${consulta}` : ''}`),
    () => filtrarLocal(filtros)
  );
}

/** RF05 — POST /web/pedidos */
export function cadastrarPedido(pedido) {
  return comFallback(
    () => chamar('pedidos', { method: 'POST', body: JSON.stringify(pedido) }),
    () => {
      const novo = { id: `PED-LOCAL-${Date.now().toString().slice(-4)}`, veiculo: null, ...pedido };
      pedidosLocais = [novo, ...pedidosLocais];
      return novo;
    }
  );
}

/** RF05 — PUT /web/pedidos/{id} */
export function alterarPedido(id, dados) {
  return comFallback(
    () => chamar(`pedidos/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(dados) }),
    () => {
      pedidosLocais = pedidosLocais.map((p) => (p.id === id ? { ...p, ...dados } : p));
      return pedidosLocais.find((p) => p.id === id);
    }
  );
}

/** RF05 — DELETE /web/pedidos/{id} */
export function excluirPedido(id) {
  return comFallback(
    () => chamar(`pedidos/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    () => {
      pedidosLocais = pedidosLocais.filter((p) => p.id !== id);
      return { sucesso: true, id };
    }
  );
}

/** RF07 — POST /web/entregas/{id}/concluir (o BFF marca os pedidos da entrega como Entregue). */
export function concluirEntrega(entregaId) {
  return comFallback(
    () => chamar(`entregas/${encodeURIComponent(entregaId)}/concluir`, { method: 'POST' }),
    () => {
      pedidosLocais = pedidosLocais.map((p) => (p.entregaId === entregaId ? { ...p, status: 'Entregue' } : p));
      return { entregaId, pedidosConcluidos: [] };
    }
  );
}

// Estado local usado só no modo offline — nunca é a fonte de dados real.
let pedidosLocais = [
  { id: 'PED-1042', cliente: 'Distribuidora Norte Ltda', entregaId: 'ENT-501', veiculoPlaca: 'ABC-1D23', status: 'Em rota', previsaoEntrega: '2026-10-20T18:00:00', veiculo: null },
  { id: 'PED-1043', cliente: 'Mercado Bom Preço', entregaId: 'ENT-501', veiculoPlaca: 'ABC-1D23', status: 'Em rota', previsaoEntrega: '2026-10-20T19:30:00', veiculo: null },
  { id: 'PED-1050', cliente: 'Auto Peças Silva', entregaId: 'ENT-502', veiculoPlaca: 'DEF-4G56', status: 'Entregue', previsaoEntrega: '2026-10-20T14:00:00', veiculo: null },
  { id: 'PED-1051', cliente: 'Construtora Horizonte', entregaId: 'ENT-503', veiculoPlaca: 'GHI-7J89', status: 'Atrasado', previsaoEntrega: '2026-10-20T11:00:00', veiculo: null },
];

function filtrarLocal(filtros) {
  return pedidosLocais.filter((p) => {
    if (filtros.id && p.id !== filtros.id) return false;
    if (filtros.entregaId && p.entregaId !== filtros.entregaId) return false;
    if (filtros.status && p.status !== filtros.status) return false;
    if (filtros.cliente && !p.cliente.toLowerCase().includes(filtros.cliente.toLowerCase())) return false;
    return true;
  });
}
