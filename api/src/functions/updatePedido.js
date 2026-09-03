const { app } = require('@azure/functions');
const { getPedidosCollection } = require('../lib/mongoClient');

// PUT /api/pedidos/{id} — Function "alterar" do CRUD (RF05/RF07).
//
// Corpo esperado (JSON): qualquer subconjunto de
// { cliente, entregaId, veiculoPlaca, status, previsaoEntrega }
// Só os campos enviados são alterados (update parcial).
const CAMPOS_PERMITIDOS = ['cliente', 'entregaId', 'veiculoPlaca', 'status', 'previsaoEntrega'];

app.http('updatePedido', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'pedidos/{id}',
  handler: async (request, context) => {
    try {
      const { id } = request.params;
      const corpo = (await request.json().catch(() => null)) || {};

      const atualizacao = {};
      for (const campo of CAMPOS_PERMITIDOS) {
        if (corpo[campo] !== undefined) atualizacao[campo] = corpo[campo];
      }

      if (Object.keys(atualizacao).length === 0) {
        return {
          status: 400,
          jsonBody: { erro: `Nenhum campo válido para atualizar. Use: ${CAMPOS_PERMITIDOS.join(', ')}` },
          headers: { 'Access-Control-Allow-Origin': '*' },
        };
      }

      atualizacao.atualizadoEm = new Date().toISOString();

      const colecao = await getPedidosCollection();
      const pedidoAtualizado = await colecao.findOneAndUpdate(
        { id },
        { $set: atualizacao },
        { returnDocument: 'after', includeResultMetadata: false, projection: { _id: 0 } }
      );

      if (!pedidoAtualizado) {
        return {
          status: 404,
          jsonBody: { erro: `Pedido ${id} não encontrado` },
          headers: { 'Access-Control-Allow-Origin': '*' },
        };
      }

      return {
        status: 200,
        jsonBody: pedidoAtualizado,
        headers: { 'Access-Control-Allow-Origin': '*' },
      };
    } catch (err) {
      context.error('Erro ao alterar pedido no MongoDB', err);
      return {
        status: 500,
        jsonBody: { erro: 'Falha ao alterar no MongoDB', detalhe: err.message },
        headers: { 'Access-Control-Allow-Origin': '*' },
      };
    }
  },
});
