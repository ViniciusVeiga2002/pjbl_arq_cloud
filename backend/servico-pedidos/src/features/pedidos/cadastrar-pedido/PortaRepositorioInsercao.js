// Porta (interface) exigida pelo caso de uso CadastrarPedidoCasoDeUso —
// Dependency Inversion Principle: o caso de uso depende desta abstração,
// não da implementação concreta em MongoDB
// (infraestrutura/persistencia/RepositorioDePedidosMongo.js).
//
// Interface Segregation Principle: a porta tem exatamente o método que este
// caso de uso usa — "inserir". Não há "buscar", "atualizar" ou "excluir"
// aqui; quem implementa esta porta não é forçado a conhecer operações que
// não lhe interessam.
//
// JavaScript puro não tem "interface" como construto da linguagem; a forma
// contratual aqui é duas coisas: (1) o JSDoc abaixo, usado por editores/
// ferramentas de tipagem; (2) verificarImplementacao(), usada pelo
// composicao/ContainerDeDependencias.js para garantir, em tempo de execução,
// que o adaptador injetado de fato expõe o método esperado.
//
// @typedef {Object} PortaRepositorioInsercao
// @property {(pedido: import('../../../dominio/Pedido')) => Promise<import('../../../dominio/Pedido')>} inserir

const NOME_METODO = 'inserir';

function verificarImplementacao(adaptador) {
  if (typeof adaptador?.[NOME_METODO] !== 'function') {
    throw new TypeError(
      `Adaptador não implementa a PortaRepositorioInsercao (método "${NOME_METODO}" ausente).`
    );
  }
  return adaptador;
}

module.exports = { verificarImplementacao };
