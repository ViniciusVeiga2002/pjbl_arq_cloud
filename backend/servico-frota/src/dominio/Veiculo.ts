import StatusVeiculo from './StatusVeiculo';
import ErroDeValidacao from './erros/ErroDeValidacao';

// Entidade Veículo (RF02/RF06/RF08): última posição e velocidade conhecidas
// de cada veículo da frota, vindas da telemetria OBD2/GPS. A regra de
// negócio do alerta de excesso de velocidade (RF08) mora aqui — antes ela
// só existia como dado fixo no mock do frontend.
const LIMITE_DE_VELOCIDADE_KMH = 80;

function exigirNumeroEntre(valor: unknown, minimo: number, maximo: number, campo: string): asserts valor is number {
  if (typeof valor !== 'number' || Number.isNaN(valor) || valor < minimo || valor > maximo) {
    throw new ErroDeValidacao(`Campo "${campo}" deve ser um número entre ${minimo} e ${maximo}.`);
  }
}

export interface DadosDoVeiculo {
  placa: string;
  motorista: string;
  lat: number;
  lng: number;
  velocidade: number;
  status: string;
  registradoEm: string;
}

export type LeituraDeTelemetria = Partial<Omit<DadosDoVeiculo, 'status'>>;

class Veiculo implements DadosDoVeiculo {
  readonly placa: string;
  readonly motorista: string;
  readonly lat: number;
  readonly lng: number;
  readonly velocidade: number;
  readonly status: string;
  readonly registradoEm: string;

  constructor({ placa, motorista, lat, lng, velocidade, status, registradoEm }: DadosDoVeiculo) {
    this.placa = placa;
    this.motorista = motorista;
    this.lat = lat;
    this.lng = lng;
    this.velocidade = velocidade;
    this.status = status;
    this.registradoEm = registradoEm;
  }

  static limiteDeVelocidadeKmh(): number {
    return LIMITE_DE_VELOCIDADE_KMH;
  }

  static calcularStatus(velocidade: number): string {
    if (velocidade === 0) return StatusVeiculo.PARADO;
    if (velocidade > LIMITE_DE_VELOCIDADE_KMH) return StatusVeiculo.ALERTA_VELOCIDADE;
    return StatusVeiculo.OK;
  }

  // Fábrica: aplica as regras de uma leitura de telemetria válida e calcula
  // o status do veículo a partir da velocidade.
  static registrarLeitura({ placa, motorista, lat, lng, velocidade, registradoEm }: LeituraDeTelemetria = {}): Veiculo {
    if (!placa) throw new ErroDeValidacao('Campo obrigatório na leitura de telemetria: placa');
    exigirNumeroEntre(lat, -90, 90, 'lat');
    exigirNumeroEntre(lng, -180, 180, 'lng');
    exigirNumeroEntre(velocidade, 0, 300, 'velocidade');

    return new Veiculo({
      placa,
      motorista: motorista || '',
      lat,
      lng,
      velocidade,
      status: Veiculo.calcularStatus(velocidade),
      registradoEm: registradoEm || new Date().toISOString(),
    });
  }
}

export default Veiculo;
