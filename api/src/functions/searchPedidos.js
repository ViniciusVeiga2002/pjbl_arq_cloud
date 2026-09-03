const { app } = require('@azure/functions');
const { getPedidosCollection } = require('../lib/mongoClient');

// GET /api/pedidos — Function "pesquisar" do CRUD (RF05/RF07).
//
// Sem parâmetros, retorna todos os pedidos cadastrados no MongoDB Atlas.
// Aceita filtros opcionais via query string, usados pela busca da tela
// "Pedidos por entrega":
//   /api/pedidos?cliente=norte     (busca parcial, sem diferenciar maiúsc.)
//   /api/pedidos?status=Em rota
//   /api/pedidos?entregaId=ENT-501
//   /api/pedidos?id=PED-123456
app.http('searchPedidos', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'pedidos',
  handler: async (request, context) => {
    try {
      const colecao = await getPedidosCollection();

      const filtro = {};
      const id = request.query.get('id');
      const entregaId = request.query.get('entregaId');
      const status = request.query.get('status');
      const cliente = request.query.get('cliente');

      if (id) filtro.id = id;
      if (entregaId) filtro.entregaId = entregaId;
      if (status) filtro.status = status;
      if (cliente) filtro.cliente = { $regex: cliente, $options: 'i' };

      const pedidos = await colecao
        .find(filtro, { projection: { _id: 0 } })
        .sort({ criadoEm: -1 })
        .toArray();

      return {
        status: 200,
        jsonBody: pedidos,
        headers: { 'Access-Control-Allow-Origin': '*' },
      };
    } catch (err) {
      context.error('Erro ao pesquisar pedidos no MongoDB', err);
      return {
        status: 500,
        jsonBody: { erro: 'Falha ao consultar o MongoDB', detalhe: err.message },
        headers: { 'Access-Control-Allow-Origin': '*' },
      };
    }
  },
});
