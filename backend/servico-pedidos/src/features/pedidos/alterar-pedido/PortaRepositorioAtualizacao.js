// Porta (interface) exigida pelo caso de uso AlterarPedidoCasoDeUso —
// Dependency Inversion Principle: o caso de uso depende desta abstração,
// não da implementação concreta em MongoDB
// (infraestrutura/persistencia/RepositorioDePedidosMongo.js).
//
// Interface Segregation Principle: a porta tem exatamente o método que este
// caso de uso usa — "atualizarPorId". Não há "inserir", "buscar" ou
// "excluir" aqui.
//
// @typedef {Object} PortaRepositorioAtualizacao
// @property {(id: string, camposParciais: object) => Promise<import('../../../dominio/Pedido')|null>} atualizarPorId

const NOME_METODO = 'atualizarPorId';

function verificarImplementacao(adaptador) {
  if (typeof adaptador?.[NOME_METODO] !== 'function') {
    throw new TypeError(
      `Adaptador não implementa a PortaRepositorioAtualizacao (método "${NOME_METODO}" ausente).`
    );
  }
  return adaptador;
}

module.exports = { verificarImplementacao };
