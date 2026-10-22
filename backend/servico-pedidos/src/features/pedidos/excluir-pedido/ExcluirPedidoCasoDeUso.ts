import EventosDePedido from '../../../dominio/eventos/EventosDePedido';
import PedidoNaoEncontradoError from '../../../dominio/erros/PedidoNaoEncontradoError';
import ExcluirPedidoComando from './ExcluirPedidoComando';
import { verificarImplementacao, PortaRepositorioExclusao } from './PortaRepositorioExclusao';
import { verificarImplementacao as verificarPublicador, PortaPublicadorDeEventos } from '../../../aplicacao/portas/PortaPublicadorDeEventos';

// Caso de uso (camada de aplicação) do slice vertical "Excluir Pedido"
// (DELETE /api/pedidos/{id} — RF05/RF07). Publica PedidoExcluido com os
// dados do pedido removido, para que o servico-frota retire o pedido da
// projeção da entrega correspondente.
class ExcluirPedidoCasoDeUso {
  private readonly repositorioDeExclusao: PortaRepositorioExclusao;
  private readonly publicadorDeEventos: PortaPublicadorDeEventos;

  constructor(repositorioDeExclusao: PortaRepositorioExclusao, publicadorDeEventos: PortaPublicadorDeEventos) {
    this.repositorioDeExclusao = verificarImplementacao(repositorioDeExclusao);
    this.publicadorDeEventos = verificarPublicador(publicadorDeEventos);
  }

  async executar(comando: ExcluirPedidoComando): Promise<{ sucesso: true; id: string }> {
    const pedidoRemovido = await this.repositorioDeExclusao.excluirPorId(comando.id);

    if (!pedidoRemovido) {
      throw new PedidoNaoEncontradoError(comando.id);
    }

    await this.publicadorDeEventos.publicar(EventosDePedido.pedidoExcluido(pedidoRemovido));
    return { sucesso: true, id: comando.id };
  }
}

export default ExcluirPedidoCasoDeUso;
