// Porta (interface) exigida pelo caso de uso AtualizarProjecaoDeEntregaCasoDeUso:
// ler e gravar a projeção de entregas no banco do PRÓPRIO servico-frota.
// "salvar" deve lançar ErroDeConcorrencia se a entrega foi gravada por outro
// processamento desde que foi lida (entrega.versao diferente da do banco).
//
// @typedef {Object} PortaRepositorioDeProjecao
// @property {(entregaId: string) => Promise<import('../../../dominio/Entrega')|null>} obterPorId
// @property {(pedidoId: string) => Promise<import('../../../dominio/Entrega')[]>} buscarPorPedido
// @property {(entrega: import('../../../dominio/Entrega')) => Promise<void>} salvar

const METODOS = Object.freeze(['obterPorId', 'buscarPorPedido', 'salvar']);

function verificarImplementacao(adaptador) {
  for (const metodo of METODOS) {
    if (typeof adaptador?.[metodo] !== 'function') {
      throw new TypeError(
        `Adaptador não implementa a PortaRepositorioDeProjecao (método "${metodo}" ausente).`
      );
    }
  }
  return adaptador;
}

module.exports = { verificarImplementacao };
