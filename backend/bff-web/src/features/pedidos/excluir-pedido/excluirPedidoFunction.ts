import { app } from '@azure/functions';
import RespostaHttp from '../../../infraestrutura/http/RespostaHttp';
import mapearErroParaHttp from '../../../infraestrutura/http/mapearErroParaHttp';
import { criarExcluirPedidoCasoDeUso } from '../../../composicao/ContainerDeDependencias';

// DELETE /api/pedidos/{id} — exposto pelo API Gateway como DELETE /api/web/pedidos/{id}.
app.http('bffExcluirPedido', {
  methods: ['DELETE'],
  authLevel: 'function',
  route: 'pedidos/{id}',
  handler: async (request, context) => {
    try {
      const resultado = await criarExcluirPedidoCasoDeUso(request).executar(request.params.id);
      return RespostaHttp.ok(resultado);
    } catch (erro) {
      return mapearErroParaHttp(erro, context);
    }
  },
});
