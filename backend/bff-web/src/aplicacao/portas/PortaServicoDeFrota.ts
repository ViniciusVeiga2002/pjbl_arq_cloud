import verificarPorta from './verificarPorta';

// Porta de saída do BFF para o microsserviço de Frota.
//
// @typedef {Object} PortaServicoDeFrota
// @property {(filtros?: object) => Promise<object[]>} listarVeiculos
// @property {(filtros?: object) => Promise<object[]>} listarEntregas

export interface VeiculoDto {
  placa: string;
  velocidade?: number;
  status: string;
  motorista?: string;
  [campo: string]: unknown;
}

export interface EntregaDto {
  id?: string;
  situacao: string;
  [campo: string]: unknown;
}

export type FiltrosDaFrota = Record<string, string | undefined>;

export interface PortaServicoDeFrota {
  listarVeiculos(filtros?: FiltrosDaFrota): Promise<VeiculoDto[]>;
  listarEntregas(filtros?: FiltrosDaFrota): Promise<EntregaDto[]>;
}

const exigirServicoDeFrota = <M extends keyof PortaServicoDeFrota>(
  adaptador: Pick<PortaServicoDeFrota, M>,
  metodos: readonly M[]
): Pick<PortaServicoDeFrota, M> => verificarPorta(adaptador, 'PortaServicoDeFrota', metodos);

export { exigirServicoDeFrota };
