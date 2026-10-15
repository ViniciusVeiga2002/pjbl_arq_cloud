const ErroDeValidacao = require('../../dominio/erros/ErroDeValidacao');
const PedidoNaoEncontradoError = require('../../dominio/erros/PedidoNaoEncontradoError');
const RespostaHttp = require('./RespostaHttp');

// Traduz um erro lançado pelo domínio/aplicação para a resposta HTTP
// correspondente. Open/Closed Principle: as 4 Functions (adaptadores HTTP)
// nunca precisam saber quais tipos de erro existem nem seus status code —
// só chamam este mapeador dentro do catch. Suportar um novo erro de domínio
// no futuro significa adicionar um "if" aqui, sem tocar em nenhuma Function.
function mapearErroParaHttp(erro, context, mensagemGenerica) {
  if (erro instanceof ErroDeValidacao) {
    return RespostaHttp.requisicaoInvalida(erro.message);
  }
  if (erro instanceof PedidoNaoEncontradoError) {
    return RespostaHttp.naoEncontrado(erro.message);
  }

  context.error(mensagemGenerica, erro);
  return RespostaHttp.erroInterno(mensagemGenerica, erro.message);
}

module.exports = mapearErroParaHttp;
