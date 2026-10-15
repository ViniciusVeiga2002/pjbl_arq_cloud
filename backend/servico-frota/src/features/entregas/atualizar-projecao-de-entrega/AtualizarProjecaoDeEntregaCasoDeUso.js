const Entrega = require('../../../dominio/Entrega');
const ErroDeConcorrencia = require('../../../dominio/erros/ErroDeConcorrencia');
const { verificarImplementacao } = require('./PortaRepositorioDeProjecao');

// Caso de uso do slice "Atualizar Projeção de Entrega" (consumidor de
// eventos): aplica PedidoCadastrado / PedidoAlterado / PedidoExcluido à
// entrega correspondente. Se o pedido mudou de entrega, ele é desvinculado
// da entrega anterior.
//
// Concorrência: o Queue Trigger processa várias mensagens em paralelo, então
// dois eventos da MESMA entrega podem ser aplicados ao mesmo tempo. O
// repositório recusa a gravação de uma versão desatualizada
// (ErroDeConcorrencia) e o caso de uso relê e reaplica o evento — seguro
// porque aplicar um evento é idempotente. Esgotadas as tentativas, o erro
// sobe e a própria fila reentrega a mensagem mais tarde.
const MAXIMO_DE_TENTATIVAS = 5;

class AtualizarProjecaoDeEntregaCasoDeUso {
  constructor(repositorioDeProjecao) {
    this.repositorioDeProjecao = verificarImplementacao(repositorioDeProjecao);
  }

  async executar(evento) {
    Entrega.validarEvento(evento);
    for (let tentativa = 1; ; tentativa++) {
      try {
        return await this.aplicar(evento);
      } catch (erro) {
        if (!(erro instanceof ErroDeConcorrencia) || tentativa >= MAXIMO_DE_TENTATIVAS) throw erro;
      }
    }
  }

  async aplicar(evento) {
    const { dados, ocorridoEm } = evento;

    const entregasComOPedido = await this.repositorioDeProjecao.buscarPorPedido(dados.id);
    for (const anterior of entregasComOPedido) {
      if (anterior.id !== dados.entregaId && anterior.desvincularPedido(dados.id, ocorridoEm)) {
        await this.repositorioDeProjecao.salvar(anterior);
      }
    }

    const entrega = (await this.repositorioDeProjecao.obterPorId(dados.entregaId)) || Entrega.nova(dados.entregaId);
    const aplicado = entrega.aplicar(evento);
    if (aplicado) await this.repositorioDeProjecao.salvar(entrega);

    return { aplicado, entrega: entrega.resumo() };
  }
}

module.exports = AtualizarProjecaoDeEntregaCasoDeUso;
