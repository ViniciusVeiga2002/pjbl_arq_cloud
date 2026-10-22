import { exigirServicoDePedidos, DadosDePedido, PedidoDto, PortaServicoDePedidos } from '../../../aplicacao/portas/PortaServicoDePedidos';

// Caso de uso do BFF "Cadastrar Pedido": repassa ao servico-pedidos, que é
// o dono da regra de negócio e do banco. O BFF não valida regra de domínio.
class CadastrarPedidoCasoDeUso {
  private readonly servicoDePedidos: Pick<PortaServicoDePedidos, 'cadastrar'>;

  constructor(servicoDePedidos: Pick<PortaServicoDePedidos, 'cadastrar'>) {
    this.servicoDePedidos = exigirServicoDePedidos(servicoDePedidos, ['cadastrar']);
  }

  async executar(dados: DadosDePedido): Promise<PedidoDto> {
    return this.servicoDePedidos.cadastrar(dados);
  }
}

export default CadastrarPedidoCasoDeUso;
