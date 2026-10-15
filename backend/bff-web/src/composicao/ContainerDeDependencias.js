const { criarClienteServicoDePedidos } = require('../infraestrutura/clientes/ClienteServicoDePedidos');
const { criarClienteServicoDeFrota } = require('../infraestrutura/clientes/ClienteServicoDeFrota');

const PesquisarPedidosCasoDeUso = require('../features/pedidos/pesquisar-pedidos/PesquisarPedidosCasoDeUso');
const CadastrarPedidoCasoDeUso = require('../features/pedidos/cadastrar-pedido/CadastrarPedidoCasoDeUso');
const AlterarPedidoCasoDeUso = require('../features/pedidos/alterar-pedido/AlterarPedidoCasoDeUso');
const ExcluirPedidoCasoDeUso = require('../features/pedidos/excluir-pedido/ExcluirPedidoCasoDeUso');
const ConcluirEntregaCasoDeUso = require('../features/pedidos/concluir-entrega/ConcluirEntregaCasoDeUso');
const ObterPainelFrotaCasoDeUso = require('../features/painel/obter-painel-frota/ObterPainelFrotaCasoDeUso');

// Composition Root do BFF: liga cada caso de uso aos clientes HTTP dos
// microsserviços. O correlation-id recebido do API Gateway é repassado aos
// clientes para seguir até os serviços.
function correlationIdDe(request) {
  return request.headers.get('x-correlation-id') || undefined;
}

module.exports = {
  criarPesquisarPedidosCasoDeUso: (request, context) =>
    new PesquisarPedidosCasoDeUso(
      criarClienteServicoDePedidos(correlationIdDe(request)),
      criarClienteServicoDeFrota(correlationIdDe(request)),
      context
    ),
  criarCadastrarPedidoCasoDeUso: (request) =>
    new CadastrarPedidoCasoDeUso(criarClienteServicoDePedidos(correlationIdDe(request))),
  criarAlterarPedidoCasoDeUso: (request) =>
    new AlterarPedidoCasoDeUso(criarClienteServicoDePedidos(correlationIdDe(request))),
  criarExcluirPedidoCasoDeUso: (request) =>
    new ExcluirPedidoCasoDeUso(criarClienteServicoDePedidos(correlationIdDe(request))),
  criarConcluirEntregaCasoDeUso: (request) =>
    new ConcluirEntregaCasoDeUso(criarClienteServicoDePedidos(correlationIdDe(request))),
  criarObterPainelFrotaCasoDeUso: (request) =>
    new ObterPainelFrotaCasoDeUso(criarClienteServicoDeFrota(correlationIdDe(request))),
};
