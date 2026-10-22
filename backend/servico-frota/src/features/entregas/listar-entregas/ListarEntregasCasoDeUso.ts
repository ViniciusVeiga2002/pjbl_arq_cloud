import { ResumoDeEntrega } from '../../../dominio/Entrega';
import ListarEntregasFiltro from './ListarEntregasFiltro';
import { verificarImplementacao, PortaRepositorioConsultaDeEntregas } from './PortaRepositorioConsultaDeEntregas';

// Caso de uso do slice "Listar Entregas" (RF07): devolve o resumo de cada
// entrega da projeção local. O filtro por situação é aplicado sobre o resumo
// porque a situação é CALCULADA pelo domínio (Entrega.situacao()), não é um
// campo gravado no banco.
class ListarEntregasCasoDeUso {
  private readonly repositorioDeConsulta: PortaRepositorioConsultaDeEntregas;

  constructor(repositorioDeConsulta: PortaRepositorioConsultaDeEntregas) {
    this.repositorioDeConsulta = verificarImplementacao(repositorioDeConsulta);
  }

  async executar(filtro: Partial<ListarEntregasFiltro> = {}): Promise<ResumoDeEntrega[]> {
    const entregas = await this.repositorioDeConsulta.listar();
    const resumos = entregas.map((entrega) => entrega.resumo()).filter((r) => r.totalDePedidos > 0);
    return filtro.situacao ? resumos.filter((r) => r.situacao === filtro.situacao) : resumos;
  }
}

export default ListarEntregasCasoDeUso;
