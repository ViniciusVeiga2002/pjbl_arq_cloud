// Erro de domínio: dados de entrada que violam uma regra de negócio ou
// invariante da entidade Pedido (ex.: campo obrigatório ausente, status
// fora do conjunto permitido). Mapeado para HTTP 400 na camada de
// apresentação (ver infraestrutura/http/mapearErroParaHttp.js).
class ErroDeValidacao extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = 'ErroDeValidacao';
  }
}

module.exports = ErroDeValidacao;
