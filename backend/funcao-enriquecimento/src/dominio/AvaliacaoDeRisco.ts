import ErroDeValidacao from './erros/ErroDeValidacao';

// Regra de negócio do enriquecimento: o "risco de atraso" de cada pedido.
// Camada mais interna — nenhuma linha aqui conhece HTTP ou Azure Functions.
//
// Pontuação (0 a 100), somada por motivo:
//  - pedido já atrasado (status "Atrasado" ou previsão vencida sem entrega): +50
//  - veículo do pedido com alerta de excesso de velocidade:                  +30
//  - pedido ainda aguardando coleta com previsão em menos de 4 horas:        +20
// Pedido "Entregue" tem risco 0.
export interface PedidoParaAvaliar {
  id: string;
  status?: string;
  veiculoPlaca?: string;
  previsaoEntrega?: string;
}

export interface VeiculoParaAvaliar {
  placa: string;
  status?: string;
}

export type NivelDeRisco = 'baixo' | 'medio' | 'alto';

export interface RiscoDoPedido {
  id: string;
  score: number;
  nivel: NivelDeRisco;
  motivos: string[];
}

export interface ResumoDeRisco {
  totalDePedidos: number;
  pedidosAtrasados: number;
  pedidosEntregues: number;
  taxaDeAtraso: number;
  riscoMedio: number;
  nivelGeral: NivelDeRisco;
}

export interface Enriquecimento {
  geradoEm: string;
  resumo: ResumoDeRisco;
  pedidos: RiscoDoPedido[];
}

const QUATRO_HORAS_MS = 4 * 60 * 60 * 1000;

export function nivelDoScore(score: number): NivelDeRisco {
  if (score >= 60) return 'alto';
  if (score >= 30) return 'medio';
  return 'baixo';
}

export function avaliarPedido(pedido: PedidoParaAvaliar, veiculosEmAlerta: ReadonlySet<string>, agora: Date): RiscoDoPedido {
  if (!pedido?.id) throw new ErroDeValidacao('Todo pedido enviado para enriquecimento precisa de "id".');
  if (pedido.status === 'Entregue') return { id: pedido.id, score: 0, nivel: 'baixo', motivos: [] };

  const motivos: string[] = [];
  let score = 0;
  const previsao = pedido.previsaoEntrega ? new Date(pedido.previsaoEntrega).getTime() : NaN;

  if (pedido.status === 'Atrasado' || (!Number.isNaN(previsao) && previsao < agora.getTime())) {
    score += 50;
    motivos.push('entrega atrasada');
  }
  if (pedido.veiculoPlaca && veiculosEmAlerta.has(pedido.veiculoPlaca)) {
    score += 30;
    motivos.push('veículo com excesso de velocidade');
  }
  if (pedido.status === 'Aguardando coleta' && !Number.isNaN(previsao) && previsao >= agora.getTime() && previsao - agora.getTime() < QUATRO_HORAS_MS) {
    score += 20;
    motivos.push('coleta ainda não realizada com prazo curto');
  }
  return { id: pedido.id, score, nivel: nivelDoScore(score), motivos };
}

export function enriquecer(pedidos: PedidoParaAvaliar[], veiculos: VeiculoParaAvaliar[], agora = new Date()): Enriquecimento {
  if (!Array.isArray(pedidos)) throw new ErroDeValidacao('Campo obrigatório no corpo da requisição: pedidos (lista).');
  const emAlerta = new Set((veiculos ?? []).filter((v) => v.status === 'alerta-velocidade').map((v) => v.placa));
  const avaliados = pedidos.map((p) => avaliarPedido(p, emAlerta, agora));

  const total = avaliados.length;
  const atrasados = avaliados.filter((r) => r.motivos.includes('entrega atrasada')).length;
  const entregues = pedidos.filter((p) => p.status === 'Entregue').length;
  const riscoMedio = total === 0 ? 0 : Math.round(avaliados.reduce((soma, r) => soma + r.score, 0) / total);

  return {
    geradoEm: agora.toISOString(),
    resumo: {
      totalDePedidos: total,
      pedidosAtrasados: atrasados,
      pedidosEntregues: entregues,
      taxaDeAtraso: total === 0 ? 0 : Math.round((atrasados / total) * 100) / 100,
      riscoMedio,
      nivelGeral: nivelDoScore(riscoMedio),
    },
    pedidos: avaliados,
  };
}
