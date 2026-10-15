const { app } = require('@azure/functions');
const RespostaHttp = require('../../../infraestrutura/http/RespostaHttp');
const mapearErroParaHttp = require('../../../infraestrutura/http/mapearErroParaHttp');
const { criarObterPainelFrotaCasoDeUso } = require('../../../composicao/ContainerDeDependencias');

// GET /api/painel-frota — exposto pelo API Gateway como GET /api/web/painel-frota.
app.http('bffObterPainelFrota', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'painel-frota',
  handler: async (request, context) => {
    try {
      const painel = await criarObterPainelFrotaCasoDeUso(request, context).executar();
      return RespostaHttp.ok(painel);
    } catch (erro) {
      return mapearErroParaHttp(erro, context);
    }
  },
});
