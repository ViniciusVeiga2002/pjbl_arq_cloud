const Pedido = require('../../../dominio/Pedido');
const EventosDePedido = require('../../../dominio/eventos/EventosDePedido');
const PedidoNaoEncontradoError = require('../../../dominio/erros/PedidoNaoEncontradoError');
const { verificarImplementacao } = require('./PortaRepositorioAtualizacao');
const { verificarImplementacao: verificarPublicador } = require('../../../aplicacao/portas/PortaPublicadorDeEventos');

// Caso de uso (camada de aplicação) do slice vertical "Alterar Pedido"
// (PUT /api/pedidos/{id} — RF05/RF07). Atualização parcial: delega ao
// domínio a regra de quais campos são válidos e aplica status (se enviado),
// trata a ausência do pedido como erro de domínio e publica PedidoAlterado
// com o estado final do pedido.
class AlterarPedidoCasoDeUso {
  constructor(repositorioDeAtualizacao, publicadorDeEventos) {
    this.repositorioDeAtualizacao = verificarImplementacao(repositorioDeAtualizacao);
    this.publicadorDeEventos = verificarPublicador(publicadorDeEventos);
  }

  async executar(comando) {
    const atualizacao = Pedido.construirAtualizacaoParcial(comando.campos);
    const pedidoAtualizado = await this.repositorioDeAtualizacao.atualizarPorId(comando.id, atualizacao);

    if (!pedidoAtualizado) {
      throw new PedidoNaoEncontradoError(comando.id);
    }

    await this.publicadorDeEventos.publicar(EventosDePedido.pedidoAlterado(pedidoAtualizado));
    return pedidoAtualizado;
  }
}

module.exports = AlterarPedidoCasoDeUso;
