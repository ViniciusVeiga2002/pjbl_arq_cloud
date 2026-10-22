// Única responsabilidade (SRP): moldar a resposta HTTP do Azure Functions.
// Sem CORS: este microsserviço só é chamado pelo BFF (servidor a servidor);
// o CORS é tratado no API Gateway.
import type { HttpResponseInit } from '@azure/functions';

const RespostaHttp = {
  ok(jsonBody: unknown): HttpResponseInit {
    return { status: 200, jsonBody };
  },
  requisicaoInvalida(mensagem: string): HttpResponseInit {
    return { status: 400, jsonBody: { erro: mensagem } };
  },
  erroInterno(mensagem: string, detalhe?: string): HttpResponseInit {
    return { status: 500, jsonBody: { erro: mensagem, detalhe } };
  },
};

export default RespostaHttp;
