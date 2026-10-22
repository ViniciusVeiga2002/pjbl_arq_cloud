// Respostas HTTP do BFF. Sem CORS: o BFF só é chamado pelo API Gateway.
import type { HttpResponseInit } from '@azure/functions';

const RespostaHttp = {
  ok(jsonBody: unknown): HttpResponseInit {
    return { status: 200, jsonBody };
  },
  criado(jsonBody: unknown): HttpResponseInit {
    return { status: 201, jsonBody };
  },
  erro(status: number, mensagem: string): HttpResponseInit {
    return { status, jsonBody: { erro: mensagem } };
  },
};

export default RespostaHttp;
