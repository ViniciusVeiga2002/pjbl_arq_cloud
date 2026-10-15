// Rate limiting por cliente em janela fixa: no máximo "limite" requisições
// por "janelaMs" para cada chave (o IP do cliente). Protege o BFF e os
// microsserviços — e a cota do plano de consumo — contra abuso.
//
// O estado fica em memória da instância do Function App: com várias
// instâncias o limite efetivo é por instância (limitação aceita no escopo;
// para um limite global, o estado iria para um cache distribuído).
class LimitadorDeRequisicoes {
  constructor({ limite, janelaMs }) {
    this.limite = limite;
    this.janelaMs = janelaMs;
    this.janelas = new Map();
  }

  registrar(chave, agora = Date.now()) {
    let janela = this.janelas.get(chave);
    if (!janela || agora - janela.inicio >= this.janelaMs) {
      janela = { inicio: agora, contagem: 0 };
      this.janelas.set(chave, janela);
    }
    janela.contagem += 1;

    const permitido = janela.contagem <= this.limite;
    return {
      permitido,
      restantes: Math.max(0, this.limite - janela.contagem),
      tentarNovamenteEmSegundos: permitido ? 0 : Math.ceil((janela.inicio + this.janelaMs - agora) / 1000),
    };
  }
}

module.exports = LimitadorDeRequisicoes;
