// Camada de acesso a dados do mfe-pedidos. Toda chamada vai para o API
// Gateway (rota /web/*, atendida pelo BFF web) — o microfrontend não conhece
// a URL de nenhum microsserviço.
//
// Resiliência (ADR-05 do Arc42): se o gateway falhar, as funções caem para
// um estado local em memória e marcam o modo offline, que a tela exibe num
// aviso visível (antes o fallback era silencioso — risco R05).
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL;
const BASE = `${GATEWAY_URL}/web`;

export interface SituacaoDoVeiculo {
  velocidade: number;
  status: string;
  motorista?: string;
}

export interface DadosDoPedido {
  cliente: string;
  entregaId: string;
  veiculoPlaca: string;
  status: string;
  previsaoEntrega: string;
}

export interface Pedido extends DadosDoPedido {
  id: string;
  veiculo: SituacaoDoVeiculo | null;
}

export type FiltrosDePedidos = Partial<Record<'id' | 'entregaId' | 'status' | 'cliente', string>>;

class ErroDeApi extends Error {
  constructor(mensagem: string, readonly status?: number) {
    super(mensagem);
  }
}

let offline = false;

export function estaOffline(): boolean {
  return offline;
}

async function chamar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const resposta = await fetch(`${BASE}/${caminho}`, {
    ...opcoes,
    headers: { 'content-type': 'application/json', ...opcoes.headers },
  });
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new ErroDeApi(corpo?.erro || `HTTP ${resposta.status}`, resposta.status);
  }
  offline = false;
  return corpo;
}

// Erro 4xx é resposta legítima do sistema (ex.: validação) e deve chegar à
// tela; só falha de rede/5xx aciona o modo offline.
function ehFalhaDeInfraestrutura(erro: unknown): boolean {
  const status = erro instanceof ErroDeApi ? erro.status : undefined;
  return !status || status >= 500;
}

async function comFallback<T>(operacao: () => Promise<T>, alternativa: () => T): Promise<T> {
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
export function pesquisarPedidos(filtros: FiltrosDePedidos = {}): Promise<Pedido[]> {
  const consulta = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v) as [string, string][]);
  return comFallback(
    () => chamar<Pedido[]>(`pedidos${consulta.size ? `?${consulta}` : ''}`),
    () => filtrarLocal(filtros)
  );
}

/** RF05 — POST /web/pedidos */
export function cadastrarPedido(pedido: DadosDoPedido): Promise<Pedido> {
  return comFallback(
    () => chamar<Pedido>('pedidos', { method: 'POST', body: JSON.stringify(pedido) }),
    () => {
      const novo: Pedido = { id: `PED-LOCAL-${Date.now().toString().slice(-4)}`, veiculo: null, ...pedido };
      pedidosLocais = [novo, ...pedidosLocais];
      return novo;
    }
  );
}

/** RF05 — PUT /web/pedidos/{id} */
export function alterarPedido(id: string, dados: DadosDoPedido): Promise<Pedido> {
  return comFallback(
    () => chamar<Pedido>(`pedidos/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(dados) }),
    () => {
      pedidosLocais = pedidosLocais.map((p) => (p.id === id ? { ...p, ...dados } : p));
      return pedidosLocais.find((p) => p.id === id)!;
    }
  );
}

/** RF05 — DELETE /web/pedidos/{id} */
export function excluirPedido(id: string): Promise<{ sucesso: boolean; id: string }> {
  return comFallback(
    () => chamar<{ sucesso: boolean; id: string }>(`pedidos/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    () => {
      pedidosLocais = pedidosLocais.filter((p) => p.id !== id);
      return { sucesso: true, id };
    }
  );
}

/** RF07 — POST /web/entregas/{id}/concluir (o BFF marca os pedidos da entrega como Entregue). */
export function concluirEntrega(entregaId: string): Promise<{ entregaId: string; pedidosConcluidos: string[] }> {
  return comFallback(
    () => chamar<{ entregaId: string; pedidosConcluidos: string[] }>(`entregas/${encodeURIComponent(entregaId)}/concluir`, { method: 'POST' }),
    () => {
      pedidosLocais = pedidosLocais.map((p) => (p.entregaId === entregaId ? { ...p, status: 'Entregue' } : p));
      return { entregaId, pedidosConcluidos: [] };
    }
  );
}

// Estado local usado só no modo offline — nunca é a fonte de dados real.
let pedidosLocais: Pedido[] = [
  { id: 'PED-1042', cliente: 'Distribuidora Norte Ltda', entregaId: 'ENT-501', veiculoPlaca: 'ABC-1D23', status: 'Em rota', previsaoEntrega: '2026-10-20T18:00:00', veiculo: null },
  { id: 'PED-1043', cliente: 'Mercado Bom Preço', entregaId: 'ENT-501', veiculoPlaca: 'ABC-1D23', status: 'Em rota', previsaoEntrega: '2026-10-20T19:30:00', veiculo: null },
  { id: 'PED-1050', cliente: 'Auto Peças Silva', entregaId: 'ENT-502', veiculoPlaca: 'DEF-4G56', status: 'Entregue', previsaoEntrega: '2026-10-20T14:00:00', veiculo: null },
  { id: 'PED-1051', cliente: 'Construtora Horizonte', entregaId: 'ENT-503', veiculoPlaca: 'GHI-7J89', status: 'Atrasado', previsaoEntrega: '2026-10-20T11:00:00', veiculo: null },
];

function filtrarLocal(filtros: FiltrosDePedidos): Pedido[] {
  return pedidosLocais.filter((p) => {
    if (filtros.id && p.id !== filtros.id) return false;
    if (filtros.entregaId && p.entregaId !== filtros.entregaId) return false;
    if (filtros.status && p.status !== filtros.status) return false;
    if (filtros.cliente && !p.cliente.toLowerCase().includes(filtros.cliente.toLowerCase())) return false;
    return true;
  });
}
