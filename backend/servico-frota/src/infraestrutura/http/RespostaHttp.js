// Única responsabilidade (SRP): moldar a resposta HTTP do Azure Functions.
// Sem CORS: este microsserviço só é chamado pelo BFF (servidor a servidor);
// o CORS é tratado no API Gateway.
const RespostaHttp = {
  ok(jsonBody) {
    return { status: 200, jsonBody };
  },
  requisicaoInvalida(mensagem) {
    return { status: 400, jsonBody: { erro: mensagem } };
  },
  erroInterno(mensagem, detalhe) {
    return { status: 500, jsonBody: { erro: mensagem, detalhe } };
  },
};

module.exports = RespostaHttp;
