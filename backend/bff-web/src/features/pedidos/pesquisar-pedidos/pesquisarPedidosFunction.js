const { app } = require('@azure/functions');
const RespostaHttp = require('../../../infraestrutura/http/RespostaHttp');
const mapearErroParaHttp = require('../../../infraestrutura/http/mapearErroParaHttp');
const { criarPesquisarPedidosCasoDeUso } = require('../../../composicao/ContainerDeDependencias');

// GET /api/pedidos[?cliente=&status=&entregaId=&id=] — exposto ao navegador
// pelo API Gateway como GET /api/web/pedidos.
app.http('bffPesquisarPedidos', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'pedidos',
  handler: async (request, context) => {
    try {
      const filtros = Object.fromEntries(
        ['cliente', 'status', 'entregaId', 'id'].map((c) => [c, request.query.get(c)]).filter(([, v]) => v)
      );
      const pedidos = await criarPesquisarPedidosCasoDeUso(request, context).executar(filtros);
      return RespostaHttp.ok(pedidos);
    } catch (erro) {
      return mapearErroParaHttp(erro, context);
    }
  },
});
