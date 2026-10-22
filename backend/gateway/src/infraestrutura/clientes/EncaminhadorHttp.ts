// Adaptador da PortaEncaminhador: entrega a requisição ao BFF por HTTP.
//
// Cada destino lógico da TabelaDeRotas ("bff-web") é resolvido aqui para a
// URL e a chave do Function App correspondente (Application settings
// BFF_WEB_URL e BFF_WEB_CHAVE). O BFF usa authLevel "function": sem a chave,
// que só o gateway tem, ele não responde.
// Formatos de entrada/saída da PortaEncaminhador. Duplicados de propósito: a
// infraestrutura não importa o slice; o compilador confere o encaixe estrutural
// no Composition Root.
interface PedidoDeEncaminhamento {
  destino: string;
  metodo: string;
  caminho: string;
  consulta?: string;
  corpo?: string;
  cabecalhos: Record<string, string>;
}

interface RespostaDoDestino {
  status: number;
  corpo: string;
  tipoDeConteudo?: string;
}

const TIMEOUT_MS = 10000;

const DESTINOS = Object.freeze({
  'bff-web': () => ({
    url: process.env.BFF_WEB_URL || 'https://pjbl-arq-cloud-bff-web.azurewebsites.net/api',
    chave: process.env.BFF_WEB_CHAVE,
  }),
});

function respostaDeErro(status: number, mensagem: string): RespostaDoDestino {
  return { status, corpo: JSON.stringify({ erro: mensagem }) };
}

function criarEncaminhadorHttp() {
  return {
    async encaminhar({ destino, metodo, caminho, consulta, corpo, cabecalhos }: PedidoDeEncaminhamento): Promise<RespostaDoDestino> {
      const { url, chave } = DESTINOS[destino as keyof typeof DESTINOS]();
      const headers: Record<string, string> = { accept: 'application/json', ...cabecalhos };
      if (chave) headers['x-functions-key'] = chave;
      if (corpo) headers['content-type'] = 'application/json';

      try {
        const resposta = await fetch(`${url.replace(/\/$/, '')}/${caminho}${consulta || ''}`, {
          method: metodo,
          headers,
          body: corpo || undefined,
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        return {
          status: resposta.status,
          corpo: await resposta.text(),
          tipoDeConteudo: resposta.headers.get('content-type') || undefined,
        };
      } catch (erro) {
        if (erro instanceof Error && erro.name === 'TimeoutError') return respostaDeErro(504, `${destino} não respondeu a tempo`);
        return respostaDeErro(502, `${destino} indisponível`);
      }
    },
  };
}

export { criarEncaminhadorHttp };
