const chamarServico = require('./chamarServico');

// Adaptador da PortaServicoDePedidos: fala HTTP com o Function App do
// microsserviço de pedidos.
// SERVICO_PEDIDOS_URL / SERVICO_PEDIDOS_CHAVE vêm dos Application settings
// do Function App do BFF (ou do local.settings.json no desenvolvimento).
const URL_PADRAO = 'https://pjbl-arq-cloud-pedidos.azurewebsites.net/api';

function criarClienteServicoDePedidos(correlationId) {
  const opcoes = {
    servico: 'servico-pedidos',
    urlBase: process.env.SERVICO_PEDIDOS_URL || URL_PADRAO,
    chave: process.env.SERVICO_PEDIDOS_CHAVE,
    correlationId,
  };
  const id = (valor) => encodeURIComponent(valor);

  return {
    pesquisar: (filtros) => chamarServico({ ...opcoes, caminho: 'pedidos', consulta: filtros }),
    cadastrar: (dados) => chamarServico({ ...opcoes, metodo: 'POST', caminho: 'pedidos', corpo: dados }),
    alterar: (pedidoId, dados) => chamarServico({ ...opcoes, metodo: 'PUT', caminho: `pedidos/${id(pedidoId)}`, corpo: dados }),
    excluir: (pedidoId) => chamarServico({ ...opcoes, metodo: 'DELETE', caminho: `pedidos/${id(pedidoId)}` }),
  };
}

module.exports = { criarClienteServicoDePedidos };
