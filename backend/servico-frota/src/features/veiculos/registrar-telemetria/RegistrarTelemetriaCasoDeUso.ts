import Veiculo from '../../../dominio/Veiculo';
import RegistrarTelemetriaComando from './RegistrarTelemetriaComando';
import { verificarImplementacao, PortaRepositorioDeLeituras } from './PortaRepositorioDeLeituras';

// Caso de uso do slice "Registrar Telemetria" (RF02/RF06/RF08): transforma
// uma leitura OBD2/GPS em um Veículo (o domínio calcula o status, inclusive
// o alerta de excesso de velocidade) e grava a última posição conhecida.
class RegistrarTelemetriaCasoDeUso {
  private readonly repositorioDeLeituras: PortaRepositorioDeLeituras;

  constructor(repositorioDeLeituras: PortaRepositorioDeLeituras) {
    this.repositorioDeLeituras = verificarImplementacao(repositorioDeLeituras);
  }

  async executar(comando: RegistrarTelemetriaComando): Promise<Veiculo> {
    const veiculo = Veiculo.registrarLeitura(comando);
    return this.repositorioDeLeituras.salvarUltimaLeitura(veiculo);
  }
}

export default RegistrarTelemetriaCasoDeUso;
