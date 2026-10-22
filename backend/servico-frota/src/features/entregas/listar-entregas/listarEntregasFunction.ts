import { app } from '@azure/functions';
import RespostaHttp from '../../../infraestrutura/http/RespostaHttp';
import mapearErroParaHttp from '../../../infraestrutura/http/mapearErroParaHttp';
import ListarEntregasFiltro from './ListarEntregasFiltro';
import { criarListarEntregasCasoDeUso } from '../../../composicao/ContainerDeDependencias';

// Adaptador HTTP do slice "Listar Entregas".
// GET /api/entregas[?situacao=Com atraso] — chamado apenas pelo BFF.
app.http('listarEntregas', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'entregas',
  handler: async (request, context) => {
    try {
      const filtro = new ListarEntregasFiltro({ situacao: request.query.get('situacao') });
      const entregas = await criarListarEntregasCasoDeUso().executar(filtro);
      return RespostaHttp.ok(entregas);
    } catch (erro) {
      return mapearErroParaHttp(erro, context, 'Falha ao consultar entregas');
    }
  },
});
