// Erro de domínio do servico-frota: dado de entrada (requisição HTTP ou
// mensagem de fila) que viola uma regra de negócio. Na borda HTTP vira 400;
// na borda de fila, a mensagem é descartada com log (reprocessar uma
// mensagem inválida nunca a tornaria válida).
class ErroDeValidacao extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = 'ErroDeValidacao';
  }
}

module.exports = ErroDeValidacao;
