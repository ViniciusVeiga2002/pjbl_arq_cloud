const { app } = require('@azure/functions');
const { getPedidosCollection } = require('../lib/mongoClient');

// POST /api/pedidos — Function "inserir" do CRUD (RF05/RF07).
//
// Corpo esperado (JSON):
// { "cliente": "...", "entregaId": "ENT-501", "veiculoPlaca": "ABC-1D23",
//   "status": "Aguardando coleta", "previsaoEntrega": "2026-09-05T18:00:00" }
//
// O "id" público (ex.: PED-482913) é gerado aqui no servidor, não pelo
// frontend, para garantir que ele seja único mesmo com vários grupos/
// usuários inserindo pedidos ao mesmo tempo.
app.http('createPedido', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'pedidos',
  handler: async (request, context) => {
    try {
      const corpo = await request.json().catch(() => null);

      if (!corpo || !corpo.cliente || !corpo.entregaId) {
        return {
          status: 400,
          jsonBody: { erro: 'Campos obrigatórios no corpo da requisição: cliente, entregaId' },
          headers: { 'Access-Control-Allow-Origin': '*' },
        };
      }

      const novoPedido = {
        id: `PED-${Date.now().toString().slice(-6)}`,
        cliente: corpo.cliente,
        entregaId: corpo.entregaId,
        veiculoPlaca: corpo.veiculoPlaca || '',
        status: corpo.status || 'Aguardando coleta',
        previsaoEntrega: corpo.previsaoEntrega || new Date().toISOString(),
        criadoEm: new Date().toISOString(),
      };

      const colecao = await getPedidosCollection();
      await colecao.insertOne(novoPedido);

      // insertOne adiciona um campo _id (ObjectId) ao objeto original por
      // referência; removemos antes de devolver pro frontend, que trabalha
      // só com o "id" (string) legível.
      const { _id, ...pedidoParaFrontend } = novoPedido;

      return {
        status: 201,
        jsonBody: pedidoParaFrontend,
        headers: { 'Access-Control-Allow-Origin': '*' },
      };
    } catch (err) {
      context.error('Erro ao inserir pedido no MongoDB', err);
      return {
        status: 500,
        jsonBody: { erro: 'Falha ao inserir no MongoDB', detalhe: err.message },
        headers: { 'Access-Control-Allow-Origin': '*' },
      };
    }
  },
});
