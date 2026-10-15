const { app } = require('@azure/functions');
const RespostaHttp = require('../../../infraestrutura/http/RespostaHttp');
const mapearErroParaHttp = require('../../../infraestrutura/http/mapearErroParaHttp');
const PesquisarPedidosFiltro = require('./PesquisarPedidosFiltro');
const { criarPesquisarPedidosCasoDeUso } = require('../../../composicao/ContainerDeDependencias');

// Adaptador HTTP do slice "Pesquisar Pedidos". Única responsabilidade:
// traduzir a query string em um Filtro, chamar o caso de uso e devolver a
// lista de pedidos. Nenhuma regra de negócio mora aqui.
//
// GET /api/pedidos — Function "pesquisar" do CRUD (RF05/RF07).
// Sem parâmetros, retorna todos os pedidos cadastrados no MongoDB Atlas.
// Aceita filtros opcionais via query string, usados pela busca da tela
// "Pedidos por entrega":
//   /api/pedidos?cliente=norte     (busca parcial, sem diferenciar maiúsc.)
//   /api/pedidos?status=Em rota
//   /api/pedidos?entregaId=ENT-501
//   /api/pedidos?id=PED-123456
app.http('pesquisarPedidos', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'pedidos',
  handler: async (request, context) => {
    try {
      const filtro = new PesquisarPedidosFiltro({
        id: request.query.get('id'),
        entregaId: request.query.get('entregaId'),
        status: request.query.get('status'),
        cliente: request.query.get('cliente'),
      });

      const pedidos = await criarPesquisarPedidosCasoDeUso().executar(filtro);
      return RespostaHttp.ok(pedidos);
    } catch (erro) {
      return mapearErroParaHttp(erro, context, 'Falha ao consultar o MongoDB');
    }
  },
});
