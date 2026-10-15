const Veiculo = require('../../../dominio/Veiculo');
const { verificarImplementacao } = require('./PortaRepositorioDeLeituras');

// Caso de uso do slice "Registrar Telemetria" (RF02/RF06/RF08): transforma
// uma leitura OBD2/GPS em um Veículo (o domínio calcula o status, inclusive
// o alerta de excesso de velocidade) e grava a última posição conhecida.
class RegistrarTelemetriaCasoDeUso {
  constructor(repositorioDeLeituras) {
    this.repositorioDeLeituras = verificarImplementacao(repositorioDeLeituras);
  }

  async executar(comando) {
    const veiculo = Veiculo.registrarLeitura(comando);
    return this.repositorioDeLeituras.salvarUltimaLeitura(veiculo);
  }
}

module.exports = RegistrarTelemetriaCasoDeUso;
