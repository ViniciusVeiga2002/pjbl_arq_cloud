// DTO de entrada do slice (camada de aplicação). Único papel: transportar
// os dados brutos recebidos pelo adaptador HTTP até o caso de uso, sem
// nenhuma regra de negócio — isso é responsabilidade exclusiva da entidade
// Pedido (Single Responsibility Principle).
class CadastrarPedidoComando {
  constructor({ cliente, entregaId, veiculoPlaca, status, previsaoEntrega } = {}) {
    this.cliente = cliente;
    this.entregaId = entregaId;
    this.veiculoPlaca = veiculoPlaca;
    this.status = status;
    this.previsaoEntrega = previsaoEntrega;
  }
}

module.exports = CadastrarPedidoComando;
