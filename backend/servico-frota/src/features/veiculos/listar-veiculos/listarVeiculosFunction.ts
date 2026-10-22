import { app } from '@azure/functions';
import RespostaHttp from '../../../infraestrutura/http/RespostaHttp';
import mapearErroParaHttp from '../../../infraestrutura/http/mapearErroParaHttp';
import ListarVeiculosFiltro from './ListarVeiculosFiltro';
import { criarListarVeiculosCasoDeUso } from '../../../composicao/ContainerDeDependencias';

// Adaptador HTTP do slice "Listar Veículos".
// GET /api/veiculos[?status=alerta-velocidade] — chamado apenas pelo BFF.
app.http('listarVeiculos', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'veiculos',
  handler: async (request, context) => {
    try {
      const filtro = new ListarVeiculosFiltro({ status: request.query.get('status') });
      const veiculos = await criarListarVeiculosCasoDeUso().executar(filtro);
      return RespostaHttp.ok(veiculos);
    } catch (erro) {
      return mapearErroParaHttp(erro, context, 'Falha ao consultar veículos');
    }
  },
});
