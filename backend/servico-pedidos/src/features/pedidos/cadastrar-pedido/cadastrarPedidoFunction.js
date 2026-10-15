const { app } = require('@azure/functions');
const RespostaHttp = require('../../../infraestrutura/http/RespostaHttp');
const mapearErroParaHttp = require('../../../infraestrutura/http/mapearErroParaHttp');
const CadastrarPedidoComando = require('./CadastrarPedidoComando');
const { criarCadastrarPedidoCasoDeUso } = require('../../../composicao/ContainerDeDependencias');

// Adaptador HTTP (camada de apresentação / "frameworks & drivers" da Clean
// Architecture) do slice "Cadastrar Pedido". Única responsabilidade: traduzir
// a requisição HTTP em um Comando, chamar o caso de uso e traduzir o
// resultado (ou erro) de volta para HTTP. Nenhuma regra de negócio mora aqui.
//
// POST /api/pedidos — Function "inserir" do CRUD (RF05/RF07).
// Corpo esperado (JSON):
// { "cliente": "...", "entregaId": "ENT-501", "veiculoPlaca": "ABC-1D23",
//   "status": "Aguardando coleta", "previsaoEntrega": "2026-09-05T18:00:00" }
app.http('cadastrarPedido', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'pedidos',
  handler: async (request, context) => {
    try {
      const corpo = await request.json().catch(() => null);
      const comando = new CadastrarPedidoComando(corpo || {});
      const pedido = await criarCadastrarPedidoCasoDeUso(context).executar(comando);
      return RespostaHttp.criado(pedido);
    } catch (erro) {
      return mapearErroParaHttp(erro, context, 'Falha ao inserir no MongoDB');
    }
  },
});
