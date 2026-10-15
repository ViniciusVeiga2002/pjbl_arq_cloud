const { exigirServicoDePedidos } = require('../../../aplicacao/portas/PortaServicoDePedidos');

// Caso de uso do BFF "Excluir Pedido": repassa ao servico-pedidos.
class ExcluirPedidoCasoDeUso {
  constructor(servicoDePedidos) {
    this.servicoDePedidos = exigirServicoDePedidos(servicoDePedidos, ['excluir']);
  }

  async executar(id) {
    return this.servicoDePedidos.excluir(id);
  }
}

module.exports = ExcluirPedidoCasoDeUso;
