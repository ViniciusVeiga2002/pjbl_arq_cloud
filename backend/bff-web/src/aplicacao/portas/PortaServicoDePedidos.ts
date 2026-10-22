import verificarPorta from './verificarPorta';

// Porta de saída do BFF para o microsserviço de Pedidos. O BFF não sabe se
// o serviço é uma Azure Function, qual é a URL ou como se autentica — isso é
// do adaptador infraestrutura/clientes/ClienteServicoDePedidos.ts.
//
// Cada caso de uso depende só do subconjunto de métodos que usa
// (Pick<PortaServicoDePedidos, ...>) — Interface Segregation no sistema de tipos.

export interface PedidoDto {
  id: string;
  entregaId?: string;
  veiculoPlaca?: string;
  status: string;
  [campo: string]: unknown;
}

export type DadosDePedido = Record<string, unknown>;

export type FiltrosDePedidos = {
  cliente?: string;
  status?: string;
  entregaId?: string;
  id?: string;
};

export interface PortaServicoDePedidos {
  pesquisar(filtros?: FiltrosDePedidos): Promise<PedidoDto[]>;
  cadastrar(dados: DadosDePedido): Promise<PedidoDto>;
  alterar(id: string, dados: DadosDePedido): Promise<PedidoDto>;
  excluir(id: string): Promise<unknown>;
}

const exigirServicoDePedidos = <M extends keyof PortaServicoDePedidos>(
  adaptador: Pick<PortaServicoDePedidos, M>,
  metodos: readonly M[]
): Pick<PortaServicoDePedidos, M> => verificarPorta(adaptador, 'PortaServicoDePedidos', metodos);

export { exigirServicoDePedidos };
