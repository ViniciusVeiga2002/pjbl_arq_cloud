// Porta (interface) exigida pelo caso de uso PesquisarPedidosCasoDeUso —
// Dependency Inversion Principle: o caso de uso depende desta abstração,
// não da implementação concreta em MongoDB
// (infraestrutura/persistencia/RepositorioDePedidosMongo.js).
//
// Interface Segregation Principle: a porta tem exatamente o método que este
// caso de uso usa — "buscarComFiltro". Não há "inserir", "atualizar" ou
// "excluir" aqui.
//
// @typedef {Object} PortaRepositorioConsulta
// @property {(criterios: { id?: string, entregaId?: string, status?: string, clienteContendo?: string }) => Promise<import('../../../dominio/Pedido')[]>} buscarComFiltro

const NOME_METODO = 'buscarComFiltro';

function verificarImplementacao(adaptador) {
  if (typeof adaptador?.[NOME_METODO] !== 'function') {
    throw new TypeError(
      `Adaptador não implementa a PortaRepositorioConsulta (método "${NOME_METODO}" ausente).`
    );
  }
  return adaptador;
}

module.exports = { verificarImplementacao };
