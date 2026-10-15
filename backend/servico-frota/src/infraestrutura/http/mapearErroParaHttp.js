const ErroDeValidacao = require('../../dominio/erros/ErroDeValidacao');
const RespostaHttp = require('./RespostaHttp');

// Traduz erro de domínio → status HTTP (Open/Closed: um novo tipo de erro
// entra aqui, sem tocar nas Functions).
function mapearErroParaHttp(erro, context, mensagemGenerica) {
  if (erro instanceof ErroDeValidacao) {
    return RespostaHttp.requisicaoInvalida(erro.message);
  }
  context.error(mensagemGenerica, erro);
  return RespostaHttp.erroInterno(mensagemGenerica, erro.message);
}

module.exports = mapearErroParaHttp;
