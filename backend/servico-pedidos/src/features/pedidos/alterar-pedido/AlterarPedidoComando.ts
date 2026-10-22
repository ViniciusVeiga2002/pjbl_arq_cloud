// DTO de entrada do slice (camada de aplicação). Único papel: transportar
// o id da rota e o corpo bruto recebido até o caso de uso — a validação de
// quais campos são permitidos é responsabilidade exclusiva da entidade
// Pedido (Single Responsibility Principle), via Pedido.construirAtualizacaoParcial.
class AlterarPedidoComando {
  readonly id: string;
  readonly campos: Record<string, unknown>;

  constructor({ id, campos }: { id: string; campos?: Record<string, unknown> }) {
    this.id = id;
    this.campos = campos || {};
  }
}

export default AlterarPedidoComando;
