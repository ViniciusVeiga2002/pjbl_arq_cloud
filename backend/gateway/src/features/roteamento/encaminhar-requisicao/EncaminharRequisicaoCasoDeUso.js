const TabelaDeRotas = require('../../../dominio/TabelaDeRotas');
const { verificarImplementacao } = require('./PortaEncaminhador');

// Caso de uso do gateway: decide O QUE fazer com uma requisição, na ordem:
// 1. rota desconhecida ou método não permitido → 404 / 405;
// 2. cliente acima do limite de requisições → 429;
// 3. senão, encaminha ao BFF de destino com o correlation-id.
// Não sabe nada de Azure Functions nem de fetch.
class EncaminharRequisicaoCasoDeUso {
  constructor(encaminhador, limitador) {
    this.encaminhador = verificarImplementacao(encaminhador);
    this.limitador = limitador;
  }

  async executar({ metodo, caminho, consulta, corpo, cliente, correlationId }) {
    const resolucao = TabelaDeRotas.resolver(caminho);
    if (!resolucao) {
      return { status: 404, corpo: JSON.stringify({ erro: `Rota não encontrada: /${caminho}` }) };
    }
    if (!resolucao.rota.metodos.includes(metodo)) {
      return { status: 405, corpo: JSON.stringify({ erro: `Método ${metodo} não permitido em /${caminho}` }) };
    }

    const limite = this.limitador.registrar(cliente);
    if (!limite.permitido) {
      return {
        status: 429,
        corpo: JSON.stringify({ erro: 'Muitas requisições. Tente novamente em instantes.' }),
        cabecalhos: { 'retry-after': String(limite.tentarNovamenteEmSegundos), 'x-ratelimit-remaining': '0' },
      };
    }

    const resposta = await this.encaminhador.encaminhar({
      destino: resolucao.rota.destino,
      metodo,
      caminho: resolucao.caminhoNoDestino,
      consulta,
      corpo,
      cabecalhos: { 'x-correlation-id': correlationId },
    });
    return { ...resposta, cabecalhos: { ...resposta.cabecalhos, 'x-ratelimit-remaining': String(limite.restantes) } };
  }
}

module.exports = EncaminharRequisicaoCasoDeUso;
