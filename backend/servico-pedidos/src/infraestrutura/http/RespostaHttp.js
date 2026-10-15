// Única responsabilidade (SRP): moldar o objeto de resposta que o Azure
// Functions espera. Não há cabeçalho CORS aqui: este microsserviço nunca é
// chamado pelo navegador — só pelo BFF, servidor a servidor. O CORS fica
// centralizado no API Gateway (backend/gateway), a única porta de entrada
// pública do sistema.
const RespostaHttp = {
  ok(jsonBody) {
    return { status: 200, jsonBody };
  },
  criado(jsonBody) {
    return { status: 201, jsonBody };
  },
  requisicaoInvalida(mensagem) {
    return { status: 400, jsonBody: { erro: mensagem } };
  },
  naoEncontrado(mensagem) {
    return { status: 404, jsonBody: { erro: mensagem } };
  },
  erroInterno(mensagem, detalhe) {
    return { status: 500, jsonBody: { erro: mensagem, detalhe } };
  },
};

module.exports = RespostaHttp;
