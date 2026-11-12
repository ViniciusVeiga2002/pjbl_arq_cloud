import verificarPorta from './verificarPorta';
import type { PedidoDto } from './PortaServicoDePedidos';
import type { VeiculoDto } from './PortaServicoDeFrota';

// Porta de saída do BFF para a Azure Function de enriquecimento (HTTP
// Trigger). O BFF não sabe que é uma Function nem como se autentica — isso é
// do adaptador infraestrutura/clientes/ClienteFuncaoDeEnriquecimento.ts.
export interface EnriquecimentoDto {
  geradoEm: string;
  resumo: Record<string, unknown>;
  pedidos: { id: string; score: number; nivel: string; motivos: string[] }[];
}

export interface PortaFuncaoDeEnriquecimento {
  calcularRisco(pedidos: PedidoDto[], veiculos: VeiculoDto[]): Promise<EnriquecimentoDto>;
}

const exigirFuncaoDeEnriquecimento = (adaptador: PortaFuncaoDeEnriquecimento): PortaFuncaoDeEnriquecimento =>
  verificarPorta(adaptador, 'PortaFuncaoDeEnriquecimento', ['calcularRisco']);

export { exigirFuncaoDeEnriquecimento };
