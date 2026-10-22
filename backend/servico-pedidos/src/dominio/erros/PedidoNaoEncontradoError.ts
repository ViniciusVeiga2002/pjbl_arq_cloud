// Erro de domínio: operação (alterar/excluir) referenciando um "id" público
// de pedido que não existe na coleção. Mapeado para HTTP 404 na camada de
// apresentação (ver infraestrutura/http/mapearErroParaHttp.ts).
class PedidoNaoEncontradoError extends Error {
  readonly id: string;

  constructor(id: string) {
    super(`Pedido ${id} não encontrado`);
    this.name = 'PedidoNaoEncontradoError';
    this.id = id;
  }
}

export default PedidoNaoEncontradoError;
