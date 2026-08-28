const { app } = require('@azure/functions');

// GET /api/pedidos
//
// Requisito obrigatório da atividade: pelo menos 1 endpoint GET de Azure
// Functions consumido pelo frontend, com dados mock.
//
// Os dados são gerados aleatoriamente a cada chamada (em memória, sem
// banco) só para demonstrar o fluxo frontend -> Azure Function com dados
// que mudam de verdade a cada requisição. Numa entrega futura do PJBL,
// este handler passaria a consultar um banco de dados real (RF05/RF07 na
// documentação do projeto).

const CLIENTES = [
  'Distribuidora Norte Ltda',
  'Mercado Bom Preço',
  'Auto Peças Silva',
  'Construtora Horizonte',
  'Farmácia Vida Saudável',
  'Supermercado Estrela',
  'Papelaria Central',
  'Depósito São José',
];

const STATUS = ['Em rota', 'Entregue', 'Atrasado', 'Aguardando coleta'];

// Cada entrega já vem amarrada a um veículo/placa, pra manter a
// consistência com a tela do mapa da frota.
const ENTREGAS = [
  { entregaId: 'ENT-501', veiculoPlaca: 'ABC-1D23' },
  { entregaId: 'ENT-502', veiculoPlaca: 'DEF-4G56' },
  { entregaId: 'ENT-503', veiculoPlaca: 'GHI-7J89' },
];

function pickRandom(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function gerarPrevisaoEntrega() {
  const agora = Date.now();
  const deslocamentoMs = (Math.random() * 8 - 2) * 60 * 60 * 1000; // -2h a +6h
  return new Date(agora + deslocamentoMs).toISOString().slice(0, 19);
}

function gerarPedidosMock() {
  const quantidade = 4 + Math.floor(Math.random() * 5); // 4 a 8 pedidos
  const numeroBase = 1000 + Math.floor(Math.random() * 9000);

  return Array.from({ length: quantidade }, (_, i) => {
    const entrega = pickRandom(ENTREGAS);
    return {
      id: `PED-${numeroBase + i}`,
      cliente: pickRandom(CLIENTES),
      entregaId: entrega.entregaId,
      veiculoPlaca: entrega.veiculoPlaca,
      status: pickRandom(STATUS),
      previsaoEntrega: gerarPrevisaoEntrega(),
    };
  });
}

app.http('getPedidos', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'pedidos',
  handler: async (request, context) => {
    context.log('GET /api/pedidos chamado');

    const pedidos = gerarPedidosMock();

    // Suporte simples a filtro por entrega: /api/pedidos?entregaId=ENT-501
    const entregaId = request.query.get('entregaId');
    const dados = entregaId
      ? pedidos.filter((p) => p.entregaId === entregaId)
      : pedidos;

    return {
      status: 200,
      jsonBody: dados,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    };
  },
});
