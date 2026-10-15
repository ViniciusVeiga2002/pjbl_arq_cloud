// Erro de domínio: operação (alterar/excluir) referenciando um "id" público
// de pedido que não existe na coleção. Mapeado para HTTP 404 na camada de
// apresentação (ver infraestrutura/http/mapearErroParaHttp.js).
class PedidoNaoEncontradoError extends Error {
  constructor(id) {
    super(`Pedido ${id} não encontrado`);
    this.name = 'PedidoNaoEncontradoError';
    this.id = id;
  }
}

module.exports = PedidoNaoEncontradoError;
