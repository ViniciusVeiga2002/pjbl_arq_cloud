const { exigirServicoDePedidos } = require('../../../aplicacao/portas/PortaServicoDePedidos');
const { exigirServicoDeFrota } = require('../../../aplicacao/portas/PortaServicoDeFrota');

// Caso de uso do BFF "Pesquisar Pedidos" (tela Pedidos por Entrega).
// É aqui que o BFF agrega valor para ESTE frontend: junta a lista de pedidos
// (servico-pedidos) com a situação atual do veículo de cada pedido
// (servico-frota), numa única resposta — a tela não precisa fazer duas
// chamadas nem cruzar dados.
//
// Se o servico-frota estiver fora do ar, os pedidos são devolvidos mesmo
// assim, com "veiculo: null" (degradação graciosa): a informação essencial
// da tela não depende do serviço secundário.
class PesquisarPedidosCasoDeUso {
  constructor(servicoDePedidos, servicoDeFrota, registrador = console) {
    this.servicoDePedidos = exigirServicoDePedidos(servicoDePedidos, ['pesquisar']);
    this.servicoDeFrota = exigirServicoDeFrota(servicoDeFrota, ['listarVeiculos']);
    this.registrador = registrador;
  }

  async executar(filtros) {
    const [pedidos, veiculos] = await Promise.all([
      this.servicoDePedidos.pesquisar(filtros),
      this.servicoDeFrota.listarVeiculos().catch((erro) => {
        this.registrador.warn(`servico-frota indisponível; pedidos sem dados de veículo: ${erro.message}`);
        return null;
      }),
    ]);

    const veiculoPorPlaca = new Map((veiculos || []).map((v) => [v.placa, v]));
    return pedidos.map((pedido) => {
      const veiculo = veiculoPorPlaca.get(pedido.veiculoPlaca);
      return {
        ...pedido,
        veiculo: veiculo ? { velocidade: veiculo.velocidade, status: veiculo.status, motorista: veiculo.motorista } : null,
      };
    });
  }
}

module.exports = PesquisarPedidosCasoDeUso;
