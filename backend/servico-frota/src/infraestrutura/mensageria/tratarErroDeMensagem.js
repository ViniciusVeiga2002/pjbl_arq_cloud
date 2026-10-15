const ErroDeValidacao = require('../../dominio/erros/ErroDeValidacao');

// Política de erro dos consumidores de fila (Queue Trigger):
// - ErroDeValidacao: a mensagem é inválida e nunca vai ficar válida —
//   registra e descarta (não relança), para não gastar retentativas.
// - Qualquer outro erro (ex.: MongoDB fora do ar): relança. O Azure
//   Functions devolve a mensagem para a fila e tenta de novo; depois de 5
//   tentativas (maxDequeueCount) ela vai para a fila "<nome>-poison".
function tratarErroDeMensagem(erro, context, mensagem) {
  if (erro instanceof ErroDeValidacao) {
    context.warn(`Mensagem descartada: ${erro.message}`, JSON.stringify(mensagem));
    return;
  }
  context.error('Falha ao processar mensagem; será reprocessada pela fila.', erro);
  throw erro;
}

module.exports = tratarErroDeMensagem;
