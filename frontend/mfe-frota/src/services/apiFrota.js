// Camada de acesso a dados do mfe-frota. Uma única chamada ao API Gateway
// (GET /web/painel-frota, atendida pelo BFF web) traz tudo que a tela
// mostra: indicadores, veículos e entregas.
//
// Se o gateway falhar, a tela usa um painel local e mostra o aviso de modo
// offline (mesma política do mfe-pedidos, implementada aqui de forma
// independente — microfrontends não compartilham código).
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL;

let offline = false;

export function estaOffline() {
  return offline;
}

/** RF06/RF07/RF08 — painel da frota montado pelo BFF. */
export async function obterPainelFrota() {
  try {
    const resposta = await fetch(`${GATEWAY_URL}/web/painel-frota`);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const painel = await resposta.json();
    offline = false;
    return painel;
  } catch (erro) {
    console.warn('[mfe-frota] Gateway indisponível, usando painel local.', erro);
    offline = true;
    return PAINEL_LOCAL;
  }
}

const PAINEL_LOCAL = {
  indicadores: { veiculos: 3, veiculosEmAlerta: 1, entregasEmAndamento: 2, entregasComAtraso: 1 },
  veiculos: [
    { placa: 'ABC-1D23', motorista: 'Juliana Ferreira', lat: -23.5505, lng: -46.6333, velocidade: 62, status: 'ok', registradoEm: null },
    { placa: 'DEF-4G56', motorista: 'Carlos Souza', lat: -23.5629, lng: -46.6544, velocidade: 0, status: 'parado', registradoEm: null },
    { placa: 'GHI-7J89', motorista: 'Marcos Pereira', lat: -23.533, lng: -46.622, velocidade: 98, status: 'alerta-velocidade', registradoEm: null },
  ],
  entregas: [
    { id: 'ENT-501', veiculoPlaca: 'ABC-1D23', situacao: 'Em rota', totalDePedidos: 2, pedidosEntregues: 0, pedidosAtrasados: 0 },
    { id: 'ENT-503', veiculoPlaca: 'GHI-7J89', situacao: 'Com atraso', totalDePedidos: 1, pedidosEntregues: 0, pedidosAtrasados: 1 },
  ],
};
