import { app } from '@azure/functions';
import RespostaHttp from '../../../infraestrutura/http/RespostaHttp';
import mapearErroParaHttp from '../../../infraestrutura/http/mapearErroParaHttp';
import { criarObterPainelFrotaCasoDeUso } from '../../../composicao/ContainerDeDependencias';

// GET /api/painel-frota — exposto pelo API Gateway como GET /api/web/painel-frota.
app.http('bffObterPainelFrota', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'painel-frota',
  handler: async (request, context) => {
    try {
      const painel = await criarObterPainelFrotaCasoDeUso(request).executar();
      return RespostaHttp.ok(painel);
    } catch (erro) {
      return mapearErroParaHttp(erro, context);
    }
  },
});
