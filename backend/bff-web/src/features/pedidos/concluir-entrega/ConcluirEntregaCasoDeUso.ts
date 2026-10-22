import { exigirServicoDePedidos, PortaServicoDePedidos } from '../../../aplicacao/portas/PortaServicoDePedidos';

// Caso de uso do BFF "Concluir Entrega" (botão da tela Pedidos por Entrega).
// A tela pensa em "entrega"; o servico-pedidos só conhece "pedido". O BFF
// faz a tradução: busca os pedidos da entrega e marca como "Entregue" os que
// ainda não estão. Cada alteração gera um evento PedidoAlterado, e o
// servico-frota atualiza sozinho a situação da entrega para "Concluída".
const STATUS_ENTREGUE = 'Entregue';

type ServicoDePedidosDaEntrega = Pick<PortaServicoDePedidos, 'pesquisar' | 'alterar'>;

class ConcluirEntregaCasoDeUso {
  private readonly servicoDePedidos: ServicoDePedidosDaEntrega;

  constructor(servicoDePedidos: ServicoDePedidosDaEntrega) {
    this.servicoDePedidos = exigirServicoDePedidos(servicoDePedidos, ['pesquisar', 'alterar']);
  }

  async executar(entregaId: string): Promise<{ entregaId: string; pedidosConcluidos: string[] }> {
    const pedidos = await this.servicoDePedidos.pesquisar({ entregaId });
    const pendentes = pedidos.filter((p) => p.status !== STATUS_ENTREGUE);

    await Promise.all(pendentes.map((p) => this.servicoDePedidos.alterar(p.id, { status: STATUS_ENTREGUE })));

    return { entregaId, pedidosConcluidos: pendentes.map((p) => p.id) };
  }
}

export default ConcluirEntregaCasoDeUso;
