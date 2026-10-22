// Porta (interface) exigida pelo caso de uso ListarEntregasCasoDeUso.
//
// @typedef {Object} PortaRepositorioConsultaDeEntregas
// @property {() => Promise<import('../../../dominio/Entrega')[]>} listar

import Entrega from '../../../dominio/Entrega';

export interface PortaRepositorioConsultaDeEntregas {
  listar(): Promise<Entrega[]>;
}

const NOME_METODO = 'listar';

function verificarImplementacao(adaptador: PortaRepositorioConsultaDeEntregas): PortaRepositorioConsultaDeEntregas {
  if (typeof adaptador?.[NOME_METODO] !== 'function') {
    throw new TypeError(
      `Adaptador não implementa a PortaRepositorioConsultaDeEntregas (método "${NOME_METODO}" ausente).`
    );
  }
  return adaptador;
}

export { verificarImplementacao };
