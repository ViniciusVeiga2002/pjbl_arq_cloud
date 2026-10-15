const { exigirServicoDePedidos } = require('../../../aplicacao/portas/PortaServicoDePedidos');

// Caso de uso do BFF "Cadastrar Pedido": repassa ao servico-pedidos, que é
// o dono da regra de negócio e do banco. O BFF não valida regra de domínio.
class CadastrarPedidoCasoDeUso {
  constructor(servicoDePedidos) {
    this.servicoDePedidos = exigirServicoDePedidos(servicoDePedidos, ['cadastrar']);
  }

  async executar(dados) {
    return this.servicoDePedidos.cadastrar(dados);
  }
}

module.exports = CadastrarPedidoCasoDeUso;
