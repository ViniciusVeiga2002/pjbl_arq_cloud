// Porta (interface) exigida pelo caso de uso ExcluirPedidoCasoDeUso —
// Dependency Inversion Principle: o caso de uso depende desta abstração,
// não da implementação concreta em MongoDB
// (infraestrutura/persistencia/RepositorioDePedidosMongo.js).
//
// Interface Segregation Principle: a porta tem exatamente o método que este
// caso de uso usa — "excluirPorId". Não há "inserir", "buscar" ou
// "atualizar" aqui.
//
// @typedef {Object} PortaRepositorioExclusao
// @property {(id: string) => Promise<import('../../../dominio/Pedido')|null>} excluirPorId

const NOME_METODO = 'excluirPorId';

function verificarImplementacao(adaptador) {
  if (typeof adaptador?.[NOME_METODO] !== 'function') {
    throw new TypeError(
      `Adaptador não implementa a PortaRepositorioExclusao (método "${NOME_METODO}" ausente).`
    );
  }
  return adaptador;
}

module.exports = { verificarImplementacao };
