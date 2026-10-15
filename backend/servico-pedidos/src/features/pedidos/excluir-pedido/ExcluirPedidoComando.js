// DTO de entrada do slice (camada de aplicação). Único papel: transportar
// o id público do pedido a excluir até o caso de uso.
class ExcluirPedidoComando {
  constructor({ id } = {}) {
    this.id = id;
  }
}

module.exports = ExcluirPedidoComando;
