// DTO de entrada do slice (camada de aplicação). "Filtro" em vez de
// "Comando" porque esta operação é uma consulta (query), não uma escrita —
// não há regra de negócio a aplicar, só vocabulário genérico de busca que a
// camada de infraestrutura (RepositorioDePedidosMongo) traduz para sintaxe
// de MongoDB (ver "clienteContendo" → "$regex" lá).
class PesquisarPedidosFiltro {
  constructor({ id, entregaId, status, cliente } = {}) {
    this.id = id;
    this.entregaId = entregaId;
    this.status = status;
    this.clienteContendo = cliente;
  }
}

module.exports = PesquisarPedidosFiltro;
