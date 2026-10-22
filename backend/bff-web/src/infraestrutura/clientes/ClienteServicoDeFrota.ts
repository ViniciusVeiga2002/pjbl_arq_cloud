import chamarServico from './chamarServico';
import { PortaServicoDeFrota, VeiculoDto, EntregaDto } from '../../aplicacao/portas/PortaServicoDeFrota';

// Adaptador da PortaServicoDeFrota: fala HTTP com o Function App do
// microsserviço de frota.
const URL_PADRAO = 'https://pjbl-arq-cloud-frota.azurewebsites.net/api';

function criarClienteServicoDeFrota(correlationId?: string): PortaServicoDeFrota {
  const opcoes = {
    servico: 'servico-frota',
    urlBase: process.env.SERVICO_FROTA_URL || URL_PADRAO,
    chave: process.env.SERVICO_FROTA_CHAVE,
    correlationId,
  };

  return {
    listarVeiculos: (filtros) => chamarServico<VeiculoDto[]>({ ...opcoes, caminho: 'veiculos', consulta: filtros }),
    listarEntregas: (filtros) => chamarServico<EntregaDto[]>({ ...opcoes, caminho: 'entregas', consulta: filtros }),
  };
}

export { criarClienteServicoDeFrota };
