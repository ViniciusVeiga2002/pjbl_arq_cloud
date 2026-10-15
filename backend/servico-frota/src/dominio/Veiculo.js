const StatusVeiculo = require('./StatusVeiculo');
const ErroDeValidacao = require('./erros/ErroDeValidacao');

// Entidade Veículo (RF02/RF06/RF08): última posição e velocidade conhecidas
// de cada veículo da frota, vindas da telemetria OBD2/GPS. A regra de
// negócio do alerta de excesso de velocidade (RF08) mora aqui — antes ela
// só existia como dado fixo no mock do frontend.
const LIMITE_DE_VELOCIDADE_KMH = 80;

function exigirNumeroEntre(valor, minimo, maximo, campo) {
  if (typeof valor !== 'number' || Number.isNaN(valor) || valor < minimo || valor > maximo) {
    throw new ErroDeValidacao(`Campo "${campo}" deve ser um número entre ${minimo} e ${maximo}.`);
  }
}

class Veiculo {
  constructor({ placa, motorista, lat, lng, velocidade, status, registradoEm }) {
    this.placa = placa;
    this.motorista = motorista;
    this.lat = lat;
    this.lng = lng;
    this.velocidade = velocidade;
    this.status = status;
    this.registradoEm = registradoEm;
  }

  static limiteDeVelocidadeKmh() {
    return LIMITE_DE_VELOCIDADE_KMH;
  }

  static calcularStatus(velocidade) {
    if (velocidade === 0) return StatusVeiculo.PARADO;
    if (velocidade > LIMITE_DE_VELOCIDADE_KMH) return StatusVeiculo.ALERTA_VELOCIDADE;
    return StatusVeiculo.OK;
  }

  // Fábrica: aplica as regras de uma leitura de telemetria válida e calcula
  // o status do veículo a partir da velocidade.
  static registrarLeitura({ placa, motorista, lat, lng, velocidade, registradoEm } = {}) {
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

module.exports = Veiculo;
