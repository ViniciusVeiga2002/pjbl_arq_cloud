import { app } from '@azure/functions';
import RespostaHttp from '../../../infraestrutura/http/RespostaHttp';
import mapearErroParaHttp from '../../../infraestrutura/http/mapearErroParaHttp';
import { DadosDePedido } from '../../../aplicacao/portas/PortaServicoDePedidos';
import { criarCadastrarPedidoCasoDeUso } from '../../../composicao/ContainerDeDependencias';

// POST /api/pedidos — exposto pelo API Gateway como POST /api/web/pedidos.
app.http('bffCadastrarPedido', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'pedidos',
  handler: async (request, context) => {
    try {
      const corpo = ((await request.json().catch(() => null)) || {}) as DadosDePedido;
      const pedido = await criarCadastrarPedidoCasoDeUso(request).executar(corpo);
      return RespostaHttp.criado(pedido);
    } catch (erro) {
      return mapearErroParaHttp(erro, context);
    }
  },
});
