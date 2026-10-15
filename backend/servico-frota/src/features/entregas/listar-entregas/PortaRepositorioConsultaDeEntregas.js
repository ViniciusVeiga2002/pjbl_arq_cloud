// Porta (interface) exigida pelo caso de uso ListarEntregasCasoDeUso.
//
// @typedef {Object} PortaRepositorioConsultaDeEntregas
// @property {() => Promise<import('../../../dominio/Entrega')[]>} listar

const NOME_METODO = 'listar';

function verificarImplementacao(adaptador) {
  if (typeof adaptador?.[NOME_METODO] !== 'function') {
    throw new TypeError(
      `Adaptador não implementa a PortaRepositorioConsultaDeEntregas (método "${NOME_METODO}" ausente).`
    );
  }
  return adaptador;
}

module.exports = { verificarImplementacao };
