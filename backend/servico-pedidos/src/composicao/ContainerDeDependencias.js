const {
  criarRepositorioDeInsercaoDePedidos,
  criarRepositorioDeConsultaDePedidos,
  criarRepositorioDeAtualizacaoDePedidos,
  criarRepositorioDeExclusaoDePedidos,
} = require('../infraestrutura/persistencia/RepositorioDePedidosMongo');
const { criarPublicadorDeEventosEmFila } = require('../infraestrutura/mensageria/PublicadorDeEventosEmFila');

const CadastrarPedidoCasoDeUso = require('../features/pedidos/cadastrar-pedido/CadastrarPedidoCasoDeUso');
const PesquisarPedidosCasoDeUso = require('../features/pedidos/pesquisar-pedidos/PesquisarPedidosCasoDeUso');
const AlterarPedidoCasoDeUso = require('../features/pedidos/alterar-pedido/AlterarPedidoCasoDeUso');
const ExcluirPedidoCasoDeUso = require('../features/pedidos/excluir-pedido/ExcluirPedidoCasoDeUso');

// Composition Root (Dependency Inversion Principle): o ÚNICO módulo do
// servico-pedidos que conhece ao mesmo tempo (a) os casos de uso de cada
// slice e (b) as implementações concretas de infraestrutura (MongoDB e fila
// de eventos do Azure Storage). Cada Function (camada de apresentação) só
// importa a fábrica do caso de uso de que precisa.
//
// Trocar MongoDB por outro banco (ADR-01 do Arc42) ou a fila do Azure
// Storage por Service Bus significa reescrever o adaptador em
// infraestrutura/ e ajustar as chamadas abaixo — nenhuma Function e nenhum
// caso de uso precisa mudar uma linha.
//
// Cada fábrica cria uma instância nova por invocação (sem estado
// compartilhado entre requisições); o que é caro — a conexão com o MongoDB e
// o cliente da fila — já é cacheado dentro da própria infraestrutura.
// "registrador" é o InvocationContext da Function, usado só para log.
function criarCadastrarPedidoCasoDeUso(registrador) {
  return new CadastrarPedidoCasoDeUso(
    criarRepositorioDeInsercaoDePedidos(),
    criarPublicadorDeEventosEmFila(registrador)
  );
}

function criarPesquisarPedidosCasoDeUso() {
  return new PesquisarPedidosCasoDeUso(criarRepositorioDeConsultaDePedidos());
}

function criarAlterarPedidoCasoDeUso(registrador) {
  return new AlterarPedidoCasoDeUso(
    criarRepositorioDeAtualizacaoDePedidos(),
    criarPublicadorDeEventosEmFila(registrador)
  );
}

function criarExcluirPedidoCasoDeUso(registrador) {
  return new ExcluirPedidoCasoDeUso(
    criarRepositorioDeExclusaoDePedidos(),
    criarPublicadorDeEventosEmFila(registrador)
  );
}

module.exports = {
  criarCadastrarPedidoCasoDeUso,
  criarPesquisarPedidosCasoDeUso,
  criarAlterarPedidoCasoDeUso,
  criarExcluirPedidoCasoDeUso,
};
