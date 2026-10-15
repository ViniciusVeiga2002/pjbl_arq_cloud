const { app } = require('@azure/functions');
const RespostaHttp = require('../../../infraestrutura/http/RespostaHttp');
const mapearErroParaHttp = require('../../../infraestrutura/http/mapearErroParaHttp');
const { criarCadastrarPedidoCasoDeUso } = require('../../../composicao/ContainerDeDependencias');

// POST /api/pedidos — exposto pelo API Gateway como POST /api/web/pedidos.
app.http('bffCadastrarPedido', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'pedidos',
  handler: async (request, context) => {
    try {
      const corpo = (await request.json().catch(() => null)) || {};
      const pedido = await criarCadastrarPedidoCasoDeUso(request, context).executar(corpo);
      return RespostaHttp.criado(pedido);
    } catch (erro) {
      return mapearErroParaHttp(erro, context);
    }
  },
});
