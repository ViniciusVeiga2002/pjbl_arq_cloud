import { app } from '@azure/functions';
import RespostaHttp from '../../../infraestrutura/http/RespostaHttp';
import mapearErroParaHttp from '../../../infraestrutura/http/mapearErroParaHttp';
import { criarConcluirEntregaCasoDeUso } from '../../../composicao/ContainerDeDependencias';

// POST /api/entregas/{id}/concluir — exposto pelo API Gateway como
// POST /api/web/entregas/{id}/concluir (RF07 — situação da entrega).
app.http('bffConcluirEntrega', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'entregas/{id}/concluir',
  handler: async (request, context) => {
    try {
      const resultado = await criarConcluirEntregaCasoDeUso(request).executar(request.params.id);
      return RespostaHttp.ok(resultado);
    } catch (erro) {
      return mapearErroParaHttp(erro, context);
    }
  },
});
