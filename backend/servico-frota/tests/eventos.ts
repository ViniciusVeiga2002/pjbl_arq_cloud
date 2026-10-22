// Fábrica de eventos de pedido para os testes, no mesmo formato publicado
// pelo servico-pedidos na fila "pedidos-eventos".
import { EventoDePedidoRecebido } from '../src/dominio/Entrega';

type DadosDoEvento = Partial<EventoDePedidoRecebido['dados']> & Pick<EventoDePedidoRecebido['dados'], 'id' | 'entregaId'>;

function eventoDePedido(tipo: string, ocorridoEm: string, dados: DadosDoEvento): EventoDePedidoRecebido & { versao: number } {
  return {
    tipo,
    versao: 1,
    ocorridoEm,
    dados: { veiculoPlaca: 'ABC-1D23', status: 'Aguardando coleta', previsaoEntrega: '2026-10-20T18:00:00.000Z', ...dados },
  };
}

export { eventoDePedido };
