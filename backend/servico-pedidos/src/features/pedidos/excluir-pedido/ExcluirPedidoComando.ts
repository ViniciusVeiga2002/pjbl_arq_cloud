// DTO de entrada do slice (camada de aplicação). Único papel: transportar
// o id público do pedido a excluir até o caso de uso.
class ExcluirPedidoComando {
  readonly id: string;

  constructor({ id }: { id: string }) {
    this.id = id;
  }
}

export default ExcluirPedidoComando;
