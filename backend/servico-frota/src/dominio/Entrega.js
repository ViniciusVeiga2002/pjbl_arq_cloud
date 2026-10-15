const ErroDeValidacao = require('./erros/ErroDeValidacao');

// Entidade Entrega (RF07) — PROJEÇÃO local, construída a partir dos eventos
// publicados pelo servico-pedidos (PedidoCadastrado, PedidoAlterado,
// PedidoExcluido). O servico-frota nunca consulta o banco de pedidos
// (Database per Service): ele mantém, no SEU banco, apenas o que precisa
// saber de cada pedido para resumir a situação da entrega.
//
// Como a fila não garante ordem, cada pedido guarda o "ocorridoEm" do
// último evento aplicado; um evento mais antigo que esse é ignorado. Um
// pedido excluído vira uma "lápide" (excluido: true) em vez de sumir, para
// que um PedidoAlterado atrasado não o ressuscite.
//
// "versao" é o número da última gravação no banco (0 = entrega ainda não
// gravada). O repositório só grava se a versão no banco ainda for a lida —
// controle de concorrência otimista (ver ErroDeConcorrencia).
const SituacaoEntrega = Object.freeze({
  SEM_PEDIDOS: 'Sem pedidos',
  AGUARDANDO_COLETA: 'Aguardando coleta',
  EM_ROTA: 'Em rota',
  COM_ATRASO: 'Com atraso',
  CONCLUIDA: 'Concluída',
});

const TIPOS_ACEITOS = Object.freeze(['PedidoCadastrado', 'PedidoAlterado', 'PedidoExcluido']);

class Entrega {
  constructor({ id, veiculoPlaca = '', pedidos = [], atualizadoEm = null, versao = 0 }) {
    this.id = id;
    this.versao = versao;
    this.veiculoPlaca = veiculoPlaca;
    this.pedidos = pedidos.map((p) => ({ ...p }));
    this.atualizadoEm = atualizadoEm;
  }

  static nova(id) {
    if (!id) throw new ErroDeValidacao('Entrega sem identificador (entregaId).');
    return new Entrega({ id });
  }

  static validarEvento(evento) {
    if (!evento || !TIPOS_ACEITOS.includes(evento.tipo)) {
      throw new ErroDeValidacao(`Tipo de evento não suportado: "${evento?.tipo}".`);
    }
    if (!evento.dados?.id || !evento.dados?.entregaId || !evento.ocorridoEm) {
      throw new ErroDeValidacao('Evento de pedido sem id, entregaId ou ocorridoEm.');
    }
  }

  // Aplica um evento de pedido a esta entrega. Devolve false quando o evento
  // é mais antigo do que o último já aplicado para o mesmo pedido.
  aplicar(evento) {
    Entrega.validarEvento(evento);
    const { tipo, dados, ocorridoEm } = evento;
    const atual = this.pedidos.find((p) => p.id === dados.id);

    if (atual && atual.ocorridoEm > ocorridoEm) return false;

    const registro = tipo === 'PedidoExcluido'
      ? { id: dados.id, status: null, excluido: true, ocorridoEm }
      : { id: dados.id, status: dados.status, previsaoEntrega: dados.previsaoEntrega, excluido: false, ocorridoEm };

    this.pedidos = atual
      ? this.pedidos.map((p) => (p.id === dados.id ? registro : p))
      : [...this.pedidos, registro];

    if (tipo !== 'PedidoExcluido' && dados.veiculoPlaca) this.veiculoPlaca = dados.veiculoPlaca;
    if (!this.atualizadoEm || ocorridoEm > this.atualizadoEm) this.atualizadoEm = ocorridoEm;
    return true;
  }

  // Remove o pedido desta entrega quando ele foi movido para outra entrega
  // (PedidoAlterado com entregaId diferente).
  desvincularPedido(pedidoId, ocorridoEm) {
    const atual = this.pedidos.find((p) => p.id === pedidoId);
    if (!atual || atual.ocorridoEm > ocorridoEm) return false;
    this.pedidos = this.pedidos.map((p) =>
      p.id === pedidoId ? { id: pedidoId, status: null, excluido: true, ocorridoEm } : p
    );
    return true;
  }

  pedidosAtivos() {
    return this.pedidos.filter((p) => !p.excluido);
  }

  situacao() {
    const ativos = this.pedidosAtivos();
    if (ativos.length === 0) return SituacaoEntrega.SEM_PEDIDOS;
    if (ativos.every((p) => p.status === 'Entregue')) return SituacaoEntrega.CONCLUIDA;
    if (ativos.some((p) => p.status === 'Atrasado')) return SituacaoEntrega.COM_ATRASO;
    if (ativos.some((p) => p.status === 'Em rota')) return SituacaoEntrega.EM_ROTA;
    return SituacaoEntrega.AGUARDANDO_COLETA;
  }

  resumo() {
    const ativos = this.pedidosAtivos();
    return {
      id: this.id,
      veiculoPlaca: this.veiculoPlaca,
      situacao: this.situacao(),
      totalDePedidos: ativos.length,
      pedidosEntregues: ativos.filter((p) => p.status === 'Entregue').length,
      pedidosAtrasados: ativos.filter((p) => p.status === 'Atrasado').length,
      atualizadoEm: this.atualizadoEm,
    };
  }
}

Entrega.Situacao = SituacaoEntrega;

module.exports = Entrega;
