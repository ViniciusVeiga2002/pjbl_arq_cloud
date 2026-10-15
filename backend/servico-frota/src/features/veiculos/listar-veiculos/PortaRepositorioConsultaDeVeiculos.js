// Porta (interface) exigida pelo caso de uso ListarVeiculosCasoDeUso.
//
// @typedef {Object} PortaRepositorioConsultaDeVeiculos
// @property {(criterios: { status?: string }) => Promise<import('../../../dominio/Veiculo')[]>} listar

const NOME_METODO = 'listar';

function verificarImplementacao(adaptador) {
  if (typeof adaptador?.[NOME_METODO] !== 'function') {
    throw new TypeError(
      `Adaptador não implementa a PortaRepositorioConsultaDeVeiculos (método "${NOME_METODO}" ausente).`
    );
  }
  return adaptador;
}

module.exports = { verificarImplementacao };
