const EventosDePedido = require('../../../dominio/eventos/EventosDePedido');
const PedidoNaoEncontradoError = require('../../../dominio/erros/PedidoNaoEncontradoError');
const { verificarImplementacao } = require('./PortaRepositorioExclusao');
const { verificarImplementacao: verificarPublicador } = require('../../../aplicacao/portas/PortaPublicadorDeEventos');

// Caso de uso (camada de aplicação) do slice vertical "Excluir Pedido"
// (DELETE /api/pedidos/{id} — RF05/RF07). Publica PedidoExcluido com os
// dados do pedido removido, para que o servico-frota retire o pedido da
// projeção da entrega correspondente.
class ExcluirPedidoCasoDeUso {
  constructor(repositorioDeExclusao, publicadorDeEventos) {
    this.repositorioDeExclusao = verificarImplementacao(repositorioDeExclusao);
    this.publicadorDeEventos = verificarPublicador(publicadorDeEventos);
  }

  async executar(comando) {
    const pedidoRemovido = await this.repositorioDeExclusao.excluirPorId(comando.id);

    if (!pedidoRemovido) {
      throw new PedidoNaoEncontradoError(comando.id);
    }

    await this.publicadorDeEventos.publicar(EventosDePedido.pedidoExcluido(pedidoRemovido));
    return { sucesso: true, id: comando.id };
  }
}

module.exports = ExcluirPedidoCasoDeUso;
