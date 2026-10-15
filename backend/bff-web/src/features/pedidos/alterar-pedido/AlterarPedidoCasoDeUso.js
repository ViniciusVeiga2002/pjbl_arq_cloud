const { exigirServicoDePedidos } = require('../../../aplicacao/portas/PortaServicoDePedidos');

// Caso de uso do BFF "Alterar Pedido": repassa ao servico-pedidos.
class AlterarPedidoCasoDeUso {
  constructor(servicoDePedidos) {
    this.servicoDePedidos = exigirServicoDePedidos(servicoDePedidos, ['alterar']);
  }

  async executar(id, dados) {
    return this.servicoDePedidos.alterar(id, dados);
  }
}

module.exports = AlterarPedidoCasoDeUso;
