const { app } = require('@azure/functions');

// GET /api/pedidos
//
// Requisito obrigatório da atividade: pelo menos 1 endpoint GET de Azure
// Functions consumido pelo frontend, com dados mock.
//
// Os dados aqui são estáticos (em memória) só para demonstrar o fluxo
// frontend -> Azure Functions. Numa entrega futura do PJBL, este handler
// passaria a consultar um banco de dados real (RF05/RF07 na documentação
// do projeto).
const PEDIDOS_MOCK = [
  {
    id: 'PED-1042',
    cliente: 'Distribuidora Norte Ltda',
    entregaId: 'ENT-501',
    veiculoPlaca: 'ABC-1D23',
    status: 'Em rota',
    previsaoEntrega: '2026-08-27T18:00:00',
  },
  {
    id: 'PED-1043',
    cliente: 'Mercado Bom Preço',
    entregaId: 'ENT-501',
    veiculoPlaca: 'ABC-1D23',
    status: 'Em rota',
    previsaoEntrega: '2026-08-27T19:30:00',
  },
  {
    id: 'PED-1050',
    cliente: 'Auto Peças Silva',
    entregaId: 'ENT-502',
    veiculoPlaca: 'DEF-4G56',
    status: 'Entregue',
    previsaoEntrega: '2026-08-27T14:00:00',
  },
  {
    id: 'PED-1051',
    cliente: 'Construtora Horizonte',
    entregaId: 'ENT-503',
    veiculoPlaca: 'GHI-7J89',
    status: 'Atrasado',
    previsaoEntrega: '2026-08-27T11:00:00',
  },
];

app.http('getPedidos', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'pedidos',
  handler: async (request, context) => {
    context.log('GET /api/pedidos chamado');

    // Suporte simples a filtro por entrega: /api/pedidos?entregaId=ENT-501
    const entregaId = request.query.get('entregaId');
    const dados = entregaId
      ? PEDIDOS_MOCK.filter((p) => p.entregaId === entregaId)
      : PEDIDOS_MOCK;

    return {
      status: 200,
      jsonBody: dados,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    };
  },
});
