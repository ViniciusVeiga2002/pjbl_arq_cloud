const { app } = require('@azure/functions');
const RespostaHttp = require('../../../infraestrutura/http/RespostaHttp');
const mapearErroParaHttp = require('../../../infraestrutura/http/mapearErroParaHttp');
const { criarAlterarPedidoCasoDeUso } = require('../../../composicao/ContainerDeDependencias');

// PUT /api/pedidos/{id} — exposto pelo API Gateway como PUT /api/web/pedidos/{id}.
app.http('bffAlterarPedido', {
  methods: ['PUT'],
  authLevel: 'function',
  route: 'pedidos/{id}',
  handler: async (request, context) => {
    try {
      const corpo = (await request.json().catch(() => null)) || {};
      const pedido = await criarAlterarPedidoCasoDeUso(request, context).executar(request.params.id, corpo);
      return RespostaHttp.ok(pedido);
    } catch (erro) {
      return mapearErroParaHttp(erro, context);
    }
  },
});
