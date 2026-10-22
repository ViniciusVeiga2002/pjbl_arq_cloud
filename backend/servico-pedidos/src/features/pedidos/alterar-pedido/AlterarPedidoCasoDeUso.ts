import Pedido from '../../../dominio/Pedido';
import EventosDePedido from '../../../dominio/eventos/EventosDePedido';
import PedidoNaoEncontradoError from '../../../dominio/erros/PedidoNaoEncontradoError';
import AlterarPedidoComando from './AlterarPedidoComando';
import { verificarImplementacao, PortaRepositorioAtualizacao } from './PortaRepositorioAtualizacao';
import { verificarImplementacao as verificarPublicador, PortaPublicadorDeEventos } from '../../../aplicacao/portas/PortaPublicadorDeEventos';

// Caso de uso (camada de aplicação) do slice vertical "Alterar Pedido"
// (PUT /api/pedidos/{id} — RF05/RF07). Atualização parcial: delega ao
// domínio a regra de quais campos são válidos e aplica status (se enviado),
// trata a ausência do pedido como erro de domínio e publica PedidoAlterado
// com o estado final do pedido.
class AlterarPedidoCasoDeUso {
  private readonly repositorioDeAtualizacao: PortaRepositorioAtualizacao;
  private readonly publicadorDeEventos: PortaPublicadorDeEventos;

  constructor(repositorioDeAtualizacao: PortaRepositorioAtualizacao, publicadorDeEventos: PortaPublicadorDeEventos) {
    this.repositorioDeAtualizacao = verificarImplementacao(repositorioDeAtualizacao);
    this.publicadorDeEventos = verificarPublicador(publicadorDeEventos);
  }

  async executar(comando: AlterarPedidoComando): Promise<Pedido> {
    const atualizacao = Pedido.construirAtualizacaoParcial(comando.campos);
    const pedidoAtualizado = await this.repositorioDeAtualizacao.atualizarPorId(comando.id, atualizacao);

    if (!pedidoAtualizado) {
      throw new PedidoNaoEncontradoError(comando.id);
    }

    await this.publicadorDeEventos.publicar(EventosDePedido.pedidoAlterado(pedidoAtualizado));
    return pedidoAtualizado;
  }
}

export default AlterarPedidoCasoDeUso;
