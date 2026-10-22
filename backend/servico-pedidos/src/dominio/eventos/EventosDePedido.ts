// Eventos de domínio do agregado Pedido (Arquitetura Orientada a Eventos).
//
// Um evento descreve um FATO que já aconteceu ("PedidoCadastrado"), no
// passado, e carrega os dados que os consumidores precisam para reagir sem
// ter que consultar de volta o serviço de pedidos (Event-Carried State
// Transfer). O consumidor atual é o servico-frota, que mantém a sua própria
// projeção de entregas no banco dele (Database per Service).
//
// Esta camada só MONTA o evento; quem decide como ele é transportado (fila
// do Azure Storage, Service Bus, etc.) é a infraestrutura, por meio da porta
// aplicacao/portas/PortaPublicadorDeEventos.ts.
const TiposDeEventoDePedido = Object.freeze({
  PEDIDO_CADASTRADO: 'PedidoCadastrado',
  PEDIDO_ALTERADO: 'PedidoAlterado',
  PEDIDO_EXCLUIDO: 'PedidoExcluido',
});

// Versão do contrato do evento: muda quando o formato de "dados" mudar de
// forma incompatível, para os consumidores saberem como interpretar.
const VERSAO_DO_CONTRATO = 1;

export interface PedidoParaEvento {
  id: string;
  entregaId: string;
  veiculoPlaca: string;
  status: string;
  previsaoEntrega: string;
}

export interface EventoDePedido {
  tipo: string;
  versao: number;
  ocorridoEm: string;
  dados: PedidoParaEvento;
}

function montarEvento(tipo: string, pedido: PedidoParaEvento): EventoDePedido {
  return {
    tipo,
    versao: VERSAO_DO_CONTRATO,
    ocorridoEm: new Date().toISOString(),
    dados: {
      id: pedido.id,
      entregaId: pedido.entregaId,
      veiculoPlaca: pedido.veiculoPlaca,
      status: pedido.status,
      previsaoEntrega: pedido.previsaoEntrega,
    },
  };
}

const EventosDePedido = Object.freeze({
  tipos: TiposDeEventoDePedido,

  pedidoCadastrado(pedido: PedidoParaEvento) {
    return montarEvento(TiposDeEventoDePedido.PEDIDO_CADASTRADO, pedido);
  },

  pedidoAlterado(pedido: PedidoParaEvento) {
    return montarEvento(TiposDeEventoDePedido.PEDIDO_ALTERADO, pedido);
  },

  pedidoExcluido(pedido: PedidoParaEvento) {
    return montarEvento(TiposDeEventoDePedido.PEDIDO_EXCLUIDO, pedido);
  },
});

export default EventosDePedido;
