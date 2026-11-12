import { app } from '@azure/functions';
import { especificacaoOpenApi, paginaSwaggerUi } from '../../../infraestrutura/documentacao/swagger';

// Documentação Swagger (OpenAPI 3) deste projeto, pública e somente leitura.
//   GET /api/openapi.json — especificação
//   GET /api/docs         — Swagger UI
app.http('openapiJson', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'openapi.json',
  handler: async () => ({ status: 200, jsonBody: especificacaoOpenApi }),
});

app.http('swaggerUi', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'docs',
  handler: async () => ({ status: 200, headers: { 'content-type': 'text/html; charset=utf-8' }, body: paginaSwaggerUi }),
});
