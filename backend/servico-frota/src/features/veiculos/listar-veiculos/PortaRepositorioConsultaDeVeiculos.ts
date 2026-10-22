// Porta (interface) exigida pelo caso de uso ListarVeiculosCasoDeUso.
//
// @typedef {Object} PortaRepositorioConsultaDeVeiculos
// @property {(criterios: { status?: string }) => Promise<import('../../../dominio/Veiculo')[]>} listar

import Veiculo from '../../../dominio/Veiculo';
import ListarVeiculosFiltro from './ListarVeiculosFiltro';

export interface PortaRepositorioConsultaDeVeiculos {
  listar(criterios?: Partial<ListarVeiculosFiltro>): Promise<Veiculo[]>;
}

const NOME_METODO = 'listar';

function verificarImplementacao(adaptador: PortaRepositorioConsultaDeVeiculos): PortaRepositorioConsultaDeVeiculos {
  if (typeof adaptador?.[NOME_METODO] !== 'function') {
    throw new TypeError(
      `Adaptador não implementa a PortaRepositorioConsultaDeVeiculos (método "${NOME_METODO}" ausente).`
    );
  }
  return adaptador;
}

export { verificarImplementacao };
