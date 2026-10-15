// Porta de saída do gateway: entregar a requisição ao destino (um BFF) e
// devolver a resposta. A implementação HTTP real está em
// infraestrutura/EncaminhadorHttp.js.
//
// @typedef {Object} PortaEncaminhador
// @property {(pedido: { destino: string, metodo: string, caminho: string, consulta: string, corpo?: string, cabecalhos: object }) => Promise<{ status: number, corpo: string, tipoDeConteudo?: string }>} encaminhar

const NOME_METODO = 'encaminhar';

function verificarImplementacao(adaptador) {
  if (typeof adaptador?.[NOME_METODO] !== 'function') {
    throw new TypeError(`Adaptador não implementa a PortaEncaminhador (método "${NOME_METODO}" ausente).`);
  }
  return adaptador;
}

module.exports = { verificarImplementacao };
