import { app } from '@azure/functions';
import RespostaHttp from '../../../infraestrutura/http/RespostaHttp';
import mapearErroParaHttp from '../../../infraestrutura/http/mapearErroParaHttp';
import ExcluirPedidoComando from './ExcluirPedidoComando';
import { criarExcluirPedidoCasoDeUso } from '../../../composicao/ContainerDeDependencias';

// Adaptador HTTP do slice "Excluir Pedido". Única responsabilidade: traduzir
// a requisição HTTP em um Comando, chamar o caso de uso e traduzir o
// resultado (ou erro) de volta para HTTP.
//
// DELETE /api/pedidos/{id} — Function "excluir" do CRUD (RF05/RF07).
app.http('excluirPedido', {
  methods: ['DELETE'],
  authLevel: 'function',
  route: 'pedidos/{id}',
  handler: async (request, context) => {
    try {
      const comando = new ExcluirPedidoComando({ id: request.params.id });
      const resultado = await criarExcluirPedidoCasoDeUso(context).executar(comando);
      return RespostaHttp.ok(resultado);
    } catch (erro) {
      return mapearErroParaHttp(erro, context, 'Falha ao excluir no MongoDB');
    }
  },
});
