import { app } from '@azure/functions';
import RespostaHttp from '../../../infraestrutura/http/RespostaHttp';
import mapearErroParaHttp from '../../../infraestrutura/http/mapearErroParaHttp';
import { DadosDePedido } from '../../../aplicacao/portas/PortaServicoDePedidos';
import { criarAlterarPedidoCasoDeUso } from '../../../composicao/ContainerDeDependencias';

// PUT /api/pedidos/{id} — exposto pelo API Gateway como PUT /api/web/pedidos/{id}.
app.http('bffAlterarPedido', {
  methods: ['PUT'],
  authLevel: 'function',
  route: 'pedidos/{id}',
  handler: async (request, context) => {
    try {
      const corpo = ((await request.json().catch(() => null)) || {}) as DadosDePedido;
      const pedido = await criarAlterarPedidoCasoDeUso(request).executar(request.params.id, corpo);
      return RespostaHttp.ok(pedido);
    } catch (erro) {
      return mapearErroParaHttp(erro, context);
    }
  },
});
