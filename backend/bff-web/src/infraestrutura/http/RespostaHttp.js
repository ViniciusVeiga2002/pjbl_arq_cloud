// Respostas HTTP do BFF. Sem CORS: o BFF só é chamado pelo API Gateway.
const RespostaHttp = {
  ok(jsonBody) {
    return { status: 200, jsonBody };
  },
  criado(jsonBody) {
    return { status: 201, jsonBody };
  },
  erro(status, mensagem) {
    return { status, jsonBody: { erro: mensagem } };
  },
};

module.exports = RespostaHttp;
