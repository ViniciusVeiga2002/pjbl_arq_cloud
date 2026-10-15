const { app } = require('@azure/functions');
const { randomUUID } = require('node:crypto');
const { criarEncaminharRequisicaoCasoDeUso, obterPoliticaDeCors } = require('../../../composicao/ContainerDeDependencias');

// API Gateway (adaptador HTTP): rota "pega-tudo" /api/{*caminho}, anônima —
// é o ÚNICO endpoint do sistema acessível pelo navegador. Responde o
// preflight de CORS, gera/propaga o x-correlation-id e entrega o resto ao
// caso de uso.
const CORRELATION_ID_VALIDO = /^[A-Za-z0-9-]{8,64}$/;

function identificarCliente(request) {
  const encaminhadoPara = request.headers.get('x-forwarded-for');
  return (encaminhadoPara ? encaminhadoPara.split(',')[0].trim() : '') || 'anonimo';
}

app.http('gateway', {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  authLevel: 'anonymous',
  route: '{*caminho}',
  handler: async (request, context) => {
    const origem = request.headers.get('origin');
    const cors = obterPoliticaDeCors().cabecalhosPara(origem);
    const recebido = request.headers.get('x-correlation-id');
    const correlationId = recebido && CORRELATION_ID_VALIDO.test(recebido) ? recebido : randomUUID();

    if (request.method === 'OPTIONS') {
      return { status: 204, headers: cors };
    }

    try {
      const resposta = await criarEncaminharRequisicaoCasoDeUso().executar({
        metodo: request.method,
        caminho: request.params.caminho || '',
        consulta: new URL(request.url).search,
        corpo: ['POST', 'PUT'].includes(request.method) ? await request.text() : undefined,
        cliente: identificarCliente(request),
        correlationId,
      });

      context.log(`${request.method} /${request.params.caminho} → ${resposta.status} [${correlationId}]`);
      return {
        status: resposta.status,
        body: resposta.corpo,
        headers: {
          'content-type': resposta.tipoDeConteudo || 'application/json; charset=utf-8',
          'x-correlation-id': correlationId,
          ...resposta.cabecalhos,
          ...cors,
        },
      };
    } catch (erro) {
      context.error(`Falha no gateway [${correlationId}]`, erro);
      return {
        status: 500,
        jsonBody: { erro: 'Falha inesperada no API Gateway' },
        headers: { 'x-correlation-id': correlationId, ...cors },
      };
    }
  },
});
