// Porta de saída do gateway: entregar a requisição ao destino (um BFF) e
// devolver a resposta. A implementação HTTP real está em
// infraestrutura/clientes/EncaminhadorHttp.ts.
//
export interface PedidoDeEncaminhamento {
  destino: string;
  metodo: string;
  caminho: string;
  consulta?: string;
  corpo?: string;
  cabecalhos: Record<string, string>;
}

export interface RespostaDoDestino {
  status: number;
  corpo: string;
  tipoDeConteudo?: string;
  cabecalhos?: Record<string, string>;
}

export interface PortaEncaminhador {
  encaminhar(pedido: PedidoDeEncaminhamento): Promise<RespostaDoDestino>;
}

const NOME_METODO = 'encaminhar';

function verificarImplementacao(adaptador: PortaEncaminhador): PortaEncaminhador {
  if (typeof adaptador?.[NOME_METODO] !== 'function') {
    throw new TypeError(`Adaptador não implementa a PortaEncaminhador (método "${NOME_METODO}" ausente).`);
  }
  return adaptador;
}

export { verificarImplementacao };
