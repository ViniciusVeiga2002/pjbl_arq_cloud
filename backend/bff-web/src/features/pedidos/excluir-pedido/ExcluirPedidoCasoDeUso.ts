import { exigirServicoDePedidos, PortaServicoDePedidos } from '../../../aplicacao/portas/PortaServicoDePedidos';

// Caso de uso do BFF "Excluir Pedido": repassa ao servico-pedidos.
class ExcluirPedidoCasoDeUso {
  private readonly servicoDePedidos: Pick<PortaServicoDePedidos, 'excluir'>;

  constructor(servicoDePedidos: Pick<PortaServicoDePedidos, 'excluir'>) {
    this.servicoDePedidos = exigirServicoDePedidos(servicoDePedidos, ['excluir']);
  }

  async executar(id: string): Promise<unknown> {
    return this.servicoDePedidos.excluir(id);
  }
}

export default ExcluirPedidoCasoDeUso;
