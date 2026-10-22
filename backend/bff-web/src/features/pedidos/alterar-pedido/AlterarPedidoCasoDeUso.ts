import { exigirServicoDePedidos, DadosDePedido, PedidoDto, PortaServicoDePedidos } from '../../../aplicacao/portas/PortaServicoDePedidos';

// Caso de uso do BFF "Alterar Pedido": repassa ao servico-pedidos.
class AlterarPedidoCasoDeUso {
  private readonly servicoDePedidos: Pick<PortaServicoDePedidos, 'alterar'>;

  constructor(servicoDePedidos: Pick<PortaServicoDePedidos, 'alterar'>) {
    this.servicoDePedidos = exigirServicoDePedidos(servicoDePedidos, ['alterar']);
  }

  async executar(id: string, dados: DadosDePedido): Promise<PedidoDto> {
    return this.servicoDePedidos.alterar(id, dados);
  }
}

export default AlterarPedidoCasoDeUso;
