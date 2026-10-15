const { app } = require('@azure/functions');
const RespostaHttp = require('../../../infraestrutura/http/RespostaHttp');
const mapearErroParaHttp = require('../../../infraestrutura/http/mapearErroParaHttp');
const { criarExcluirPedidoCasoDeUso } = require('../../../composicao/ContainerDeDependencias');

// DELETE /api/pedidos/{id} — exposto pelo API Gateway como DELETE /api/web/pedidos/{id}.
app.http('bffExcluirPedido', {
  methods: ['DELETE'],
  authLevel: 'function',
  route: 'pedidos/{id}',
  handler: async (request, context) => {
    try {
      const resultado = await criarExcluirPedidoCasoDeUso(request, context).executar(request.params.id);
      return RespostaHttp.ok(resultado);
    } catch (erro) {
      return mapearErroParaHttp(erro, context);
    }
  },
});
