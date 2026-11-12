import chamarServico from './chamarServico';
import { PortaFuncaoDeEnriquecimento, EnriquecimentoDto } from '../../aplicacao/portas/PortaFuncaoDeEnriquecimento';

// Adaptador da PortaFuncaoDeEnriquecimento: fala HTTP com o Function App da
// funcao-enriquecimento (HTTP Trigger).
const URL_PADRAO = 'https://pjbl-arq-cloud-enriquecimento.azurewebsites.net/api';

function criarClienteFuncaoDeEnriquecimento(correlationId?: string): PortaFuncaoDeEnriquecimento {
  const opcoes = {
    servico: 'funcao-enriquecimento',
    urlBase: process.env.FUNCAO_ENRIQUECIMENTO_URL || URL_PADRAO,
    chave: process.env.FUNCAO_ENRIQUECIMENTO_CHAVE,
    correlationId,
  };

  return {
    calcularRisco: (pedidos, veiculos) =>
      chamarServico<EnriquecimentoDto>({ ...opcoes, metodo: 'POST', caminho: 'enriquecer', corpo: { pedidos, veiculos } }),
  };
}

export { criarClienteFuncaoDeEnriquecimento };
