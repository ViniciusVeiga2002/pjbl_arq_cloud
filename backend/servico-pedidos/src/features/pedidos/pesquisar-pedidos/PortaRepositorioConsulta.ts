// Porta (interface) exigida pelo caso de uso PesquisarPedidosCasoDeUso —
// Dependency Inversion Principle: o caso de uso depende desta abstração,
// não da implementação concreta em MongoDB
// (infraestrutura/persistencia/RepositorioDePedidosMongo.ts).
//
// Interface Segregation Principle: a porta tem exatamente o método que este
// caso de uso usa — "buscarComFiltro". Não há "inserir", "atualizar" ou
// "excluir" aqui.
//
import Pedido from '../../../dominio/Pedido';
import PesquisarPedidosFiltro from './PesquisarPedidosFiltro';

export interface PortaRepositorioConsulta {
  buscarComFiltro(criterios: Partial<PesquisarPedidosFiltro>): Promise<Pedido[]>;
}

const NOME_METODO = 'buscarComFiltro';

function verificarImplementacao(adaptador: PortaRepositorioConsulta): PortaRepositorioConsulta {
  if (typeof adaptador?.[NOME_METODO] !== 'function') {
    throw new TypeError(
      `Adaptador não implementa a PortaRepositorioConsulta (método "${NOME_METODO}" ausente).`
    );
  }
  return adaptador;
}

export { verificarImplementacao };
