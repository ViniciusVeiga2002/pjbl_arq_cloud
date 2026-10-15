// DTO de entrada do slice: os dados de uma leitura de telemetria
// (evento "LeituraDeTelemetriaRecebida" da fila telemetria-veiculos).
class RegistrarTelemetriaComando {
  constructor({ placa, motorista, lat, lng, velocidade, registradoEm } = {}) {
    this.placa = placa;
    this.motorista = motorista;
    this.lat = lat;
    this.lng = lng;
    this.velocidade = velocidade;
    this.registradoEm = registradoEm;
  }

  static aPartirDoEvento(evento) {
    return new RegistrarTelemetriaComando({ ...evento?.dados, registradoEm: evento?.ocorridoEm });
  }
}

module.exports = RegistrarTelemetriaComando;
