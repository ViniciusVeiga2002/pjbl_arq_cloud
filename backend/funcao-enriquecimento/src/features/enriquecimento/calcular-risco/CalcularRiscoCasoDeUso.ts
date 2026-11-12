import { enriquecer, Enriquecimento, PedidoParaAvaliar, VeiculoParaAvaliar } from '../../../dominio/AvaliacaoDeRisco';

// Caso de uso "Calcular risco": enriquece uma lista de pedidos com o risco de
// atraso. Função pura (sem banco, fila ou chamada externa) — por isso é
// serverless por natureza e barata de testar. O relógio é injetável.
export interface CalcularRiscoComando {
  pedidos: PedidoParaAvaliar[];
  veiculos: VeiculoParaAvaliar[];
}

class CalcularRiscoCasoDeUso {
  constructor(private readonly relogio: () => Date = () => new Date()) {}

  executar({ pedidos, veiculos }: CalcularRiscoComando): Enriquecimento {
    return enriquecer(pedidos, veiculos, this.relogio());
  }
}

export default CalcularRiscoCasoDeUso;
