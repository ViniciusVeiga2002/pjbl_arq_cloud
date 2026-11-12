import { app } from '@azure/functions';
import RespostaHttp from '../../../infraestrutura/http/RespostaHttp';
import mapearErroParaHttp from '../../../infraestrutura/http/mapearErroParaHttp';
import { criarCalcularRiscoCasoDeUso } from '../../../composicao/ContainerDeDependencias';

// Adaptador HTTP (HTTP Trigger) do slice "Calcular risco".
// POST /api/enriquecer — chamado apenas pelo BFF (authLevel "function").
// Corpo: { "pedidos": [{ id, status, veiculoPlaca, previsaoEntrega }],
//          "veiculos": [{ placa, status }] }
app.http('calcularRisco', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'enriquecer',
  handler: async (request, context) => {
    try {
      const corpo = (await request.json().catch(() => null)) as { pedidos?: never; veiculos?: never } | null;
      const resultado = criarCalcularRiscoCasoDeUso().executar({ pedidos: corpo?.pedidos as never, veiculos: corpo?.veiculos ?? [] });
      return RespostaHttp.ok(resultado);
    } catch (erro) {
      return mapearErroParaHttp(erro, context, 'Falha ao calcular o risco');
    }
  },
});
