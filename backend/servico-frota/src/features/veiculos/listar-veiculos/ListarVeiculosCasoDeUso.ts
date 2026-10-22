import Veiculo from '../../../dominio/Veiculo';
import ListarVeiculosFiltro from './ListarVeiculosFiltro';
import { verificarImplementacao, PortaRepositorioConsultaDeVeiculos } from './PortaRepositorioConsultaDeVeiculos';

// Caso de uso do slice "Listar Veículos" (RF06 — mapa da frota): só leitura.
class ListarVeiculosCasoDeUso {
  private readonly repositorioDeConsulta: PortaRepositorioConsultaDeVeiculos;

  constructor(repositorioDeConsulta: PortaRepositorioConsultaDeVeiculos) {
    this.repositorioDeConsulta = verificarImplementacao(repositorioDeConsulta);
  }

  async executar(filtro?: ListarVeiculosFiltro): Promise<Veiculo[]> {
    return this.repositorioDeConsulta.listar(filtro);
  }
}

export default ListarVeiculosCasoDeUso;
