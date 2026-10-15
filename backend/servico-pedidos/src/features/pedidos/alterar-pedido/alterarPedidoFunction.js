const { app } = require('@azure/functions');
const RespostaHttp = require('../../../infraestrutura/http/RespostaHttp');
const mapearErroParaHttp = require('../../../infraestrutura/http/mapearErroParaHttp');
const AlterarPedidoComando = require('./AlterarPedidoComando');
const { criarAlterarPedidoCasoDeUso } = require('../../../composicao/ContainerDeDependencias');

// Adaptador HTTP do slice "Alterar Pedido". Única responsabilidade: traduzir
// a requisição HTTP em um Comando, chamar o caso de uso e traduzir o
// resultado (ou erro) de volta para HTTP.
//
// PUT /api/pedidos/{id} — Function "alterar" do CRUD (RF05/RF07).
// Corpo esperado (JSON): qualquer subconjunto de
// { cliente, entregaId, veiculoPlaca, status, previsaoEntrega }
// Só os campos enviados são alterados (update parcial).
app.http('alterarPedido', {
  methods: ['PUT'],
  authLevel: 'function',
  route: 'pedidos/{id}',
  handler: async (request, context) => {
    try {
      const corpo = (await request.json().catch(() => null)) || {};
      const comando = new AlterarPedidoComando({ id: request.params.id, campos: corpo });
      const pedidoAtualizado = await criarAlterarPedidoCasoDeUso(context).executar(comando);
      return RespostaHttp.ok(pedidoAtualizado);
    } catch (erro) {
      return mapearErroParaHttp(erro, context, 'Falha ao alterar no MongoDB');
    }
  },
});
