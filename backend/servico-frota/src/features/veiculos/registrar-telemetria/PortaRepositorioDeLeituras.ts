// Porta (interface) exigida pelo caso de uso RegistrarTelemetriaCasoDeUso.
// Interface Segregation: um único método — gravar a última leitura do
// veículo (upsert pela placa).
//
// @typedef {Object} PortaRepositorioDeLeituras
// @property {(veiculo: import('../../../dominio/Veiculo')) => Promise<import('../../../dominio/Veiculo')>} salvarUltimaLeitura

import Veiculo from '../../../dominio/Veiculo';

export interface PortaRepositorioDeLeituras {
  salvarUltimaLeitura(veiculo: Veiculo): Promise<Veiculo>;
}

const NOME_METODO = 'salvarUltimaLeitura';

function verificarImplementacao(adaptador: PortaRepositorioDeLeituras): PortaRepositorioDeLeituras {
  if (typeof adaptador?.[NOME_METODO] !== 'function') {
    throw new TypeError(
      `Adaptador não implementa a PortaRepositorioDeLeituras (método "${NOME_METODO}" ausente).`
    );
  }
  return adaptador;
}

export { verificarImplementacao };
