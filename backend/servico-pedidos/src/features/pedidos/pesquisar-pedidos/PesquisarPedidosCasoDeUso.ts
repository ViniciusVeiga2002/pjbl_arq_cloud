import Pedido from '../../../dominio/Pedido';
import PesquisarPedidosFiltro from './PesquisarPedidosFiltro';
import { verificarImplementacao, PortaRepositorioConsulta } from './PortaRepositorioConsulta';

// Caso de uso (camada de aplicação) do slice vertical "Pesquisar Pedidos"
// (GET /api/pedidos — RF05/RF07). É só leitura: não há regra de domínio a
// aplicar, então o caso de uso apenas repassa o filtro à porta injetada.
class PesquisarPedidosCasoDeUso {
  private readonly repositorioDeConsulta: PortaRepositorioConsulta;

  constructor(repositorioDeConsulta: PortaRepositorioConsulta) {
    this.repositorioDeConsulta = verificarImplementacao(repositorioDeConsulta);
  }

  async executar(filtro: PesquisarPedidosFiltro): Promise<Pedido[]> {
    return this.repositorioDeConsulta.buscarComFiltro(filtro);
  }
}

export default PesquisarPedidosCasoDeUso;
