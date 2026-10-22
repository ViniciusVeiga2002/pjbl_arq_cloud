// DTO de entrada do slice (camada de aplicação). "Filtro" em vez de
// "Comando" porque esta operação é uma consulta (query), não uma escrita —
// não há regra de negócio a aplicar, só vocabulário genérico de busca que a
// camada de infraestrutura (RepositorioDePedidosMongo) traduz para sintaxe
// de MongoDB (ver "clienteContendo" → "$regex" lá).
class PesquisarPedidosFiltro {
  readonly id?: string;
  readonly entregaId?: string;
  readonly status?: string;
  readonly clienteContendo?: string;

  constructor({ id, entregaId, status, cliente }: { id?: string; entregaId?: string; status?: string; cliente?: string } = {}) {
    this.id = id;
    this.entregaId = entregaId;
    this.status = status;
    this.clienteContendo = cliente;
  }
}

export default PesquisarPedidosFiltro;
