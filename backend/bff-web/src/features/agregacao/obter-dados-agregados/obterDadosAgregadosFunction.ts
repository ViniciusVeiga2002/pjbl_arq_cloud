import { app } from '@azure/functions';
import RespostaHttp from '../../../infraestrutura/http/RespostaHttp';
import mapearErroParaHttp from '../../../infraestrutura/http/mapearErroParaHttp';
import { criarObterDadosAgregadosCasoDeUso } from '../../../composicao/ContainerDeDependencias';

// GET /api/aggregated-data — exposto pelo API Gateway como
// GET /api/web/aggregated-data. Endpoint obrigatório do PJBL: devolve, num
// único response, pedidos (Mongo), frota (MongoDB) e o enriquecimento da
// Azure Function.
app.http('bffObterDadosAgregados', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'aggregated-data',
  handler: async (request, context) => {
    try {
      const dados = await criarObterDadosAgregadosCasoDeUso(request).executar();
      return RespostaHttp.ok(dados);
    } catch (erro) {
      return mapearErroParaHttp(erro, context);
    }
  },
});
