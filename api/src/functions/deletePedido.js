const { app } = require('@azure/functions');
const { getPedidosCollection } = require('../lib/mongoClient');

// DELETE /api/pedidos/{id} — Function "excluir" do CRUD (RF05/RF07).
app.http('deletePedido', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'pedidos/{id}',
  handler: async (request, context) => {
    try {
      const { id } = request.params;

      const colecao = await getPedidosCollection();
      const pedidoRemovido = await colecao.findOneAndDelete(
        { id },
        { includeResultMetadata: false, projection: { _id: 0 } }
      );

      if (!pedidoRemovido) {
        return {
          status: 404,
          jsonBody: { erro: `Pedido ${id} não encontrado` },
          headers: { 'Access-Control-Allow-Origin': '*' },
        };
      }

      return {
        status: 200,
        jsonBody: { sucesso: true, id },
        headers: { 'Access-Control-Allow-Origin': '*' },
      };
    } catch (err) {
      context.error('Erro ao excluir pedido no MongoDB', err);
      return {
        status: 500,
        jsonBody: { erro: 'Falha ao excluir no MongoDB', detalhe: err.message },
        headers: { 'Access-Control-Allow-Origin': '*' },
      };
    }
  },
});
