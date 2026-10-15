const ErroDeServicoRemoto = require('../../aplicacao/erros/ErroDeServicoRemoto');

// Chamada HTTP servidor-a-servidor do BFF para um microsserviço.
// - x-functions-key: os microsserviços usam authLevel "function", então só
//   quem tem a chave (o BFF) consegue chamá-los — o navegador não.
// - x-correlation-id: o mesmo id gerado no API Gateway segue até o
//   microsserviço, permitindo rastrear uma requisição em todos os logs.
// - timeout: um serviço lento não prende a Function do BFF indefinidamente.
const TIMEOUT_MS = 8000;

async function chamarServico({ servico, urlBase, chave, correlationId, metodo = 'GET', caminho, consulta, corpo }) {
  const url = new URL(`${urlBase.replace(/\/$/, '')}/${caminho}`);
  for (const [nome, valor] of Object.entries(consulta || {})) {
    if (valor) url.searchParams.set(nome, valor);
  }

  const cabecalhos = { accept: 'application/json' };
  if (chave) cabecalhos['x-functions-key'] = chave;
  if (correlationId) cabecalhos['x-correlation-id'] = correlationId;
  if (corpo !== undefined) cabecalhos['content-type'] = 'application/json';

  let resposta;
  try {
    resposta = await fetch(url, {
      method: metodo,
      headers: cabecalhos,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (erro) {
    const status = erro.name === 'TimeoutError' ? 504 : 502;
    throw new ErroDeServicoRemoto(servico, status, `${servico} indisponível: ${erro.message}`);
  }

  const conteudo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new ErroDeServicoRemoto(servico, resposta.status, conteudo?.erro || `${servico} respondeu HTTP ${resposta.status}`);
  }
  return conteudo;
}

module.exports = chamarServico;
