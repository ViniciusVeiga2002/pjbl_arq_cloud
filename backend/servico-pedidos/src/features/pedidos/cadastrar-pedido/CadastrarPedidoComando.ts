// DTO de entrada do slice (camada de aplicação). Único papel: transportar
// os dados brutos recebidos pelo adaptador HTTP até o caso de uso, sem
// nenhuma regra de negócio — isso é responsabilidade exclusiva da entidade
// Pedido (Single Responsibility Principle).
import { DadosParaCriarPedido } from '../../../dominio/Pedido';

class CadastrarPedidoComando {
  readonly cliente?: string;
  readonly entregaId?: string;
  readonly veiculoPlaca?: string;
  readonly status?: string;
  readonly previsaoEntrega?: string;

  constructor({ cliente, entregaId, veiculoPlaca, status, previsaoEntrega }: DadosParaCriarPedido = {}) {
    this.cliente = cliente;
    this.entregaId = entregaId;
    this.veiculoPlaca = veiculoPlaca;
    this.status = status;
    this.previsaoEntrega = previsaoEntrega;
  }
}

export default CadastrarPedidoComando;
