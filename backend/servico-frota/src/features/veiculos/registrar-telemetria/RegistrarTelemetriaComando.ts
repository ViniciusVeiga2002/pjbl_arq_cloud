// DTO de entrada do slice: os dados de uma leitura de telemetria
// (evento "LeituraDeTelemetriaRecebida" da fila telemetria-veiculos).
import { LeituraDeTelemetria } from '../../../dominio/Veiculo';

class RegistrarTelemetriaComando implements LeituraDeTelemetria {
  readonly placa?: string;
  readonly motorista?: string;
  readonly lat?: number;
  readonly lng?: number;
  readonly velocidade?: number;
  readonly registradoEm?: string;

  constructor({ placa, motorista, lat, lng, velocidade, registradoEm }: LeituraDeTelemetria = {}) {
    this.placa = placa;
    this.motorista = motorista;
    this.lat = lat;
    this.lng = lng;
    this.velocidade = velocidade;
    this.registradoEm = registradoEm;
  }

  static aPartirDoEvento(mensagem: unknown): RegistrarTelemetriaComando {
    const evento = mensagem as { dados?: LeituraDeTelemetria; ocorridoEm?: string } | null | undefined;
    return new RegistrarTelemetriaComando({ ...evento?.dados, registradoEm: evento?.ocorridoEm });
  }
}

export default RegistrarTelemetriaComando;
