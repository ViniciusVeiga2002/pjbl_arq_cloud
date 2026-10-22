// Porta (interface) exigida pelo caso de uso ExcluirPedidoCasoDeUso —
// Dependency Inversion Principle: o caso de uso depende desta abstração,
// não da implementação concreta em MongoDB
// (infraestrutura/persistencia/RepositorioDePedidosMongo.ts).
//
// Interface Segregation Principle: a porta tem exatamente o método que este
// caso de uso usa — "excluirPorId". Não há "inserir", "buscar" ou
// "atualizar" aqui.
//
import Pedido from '../../../dominio/Pedido';

export interface PortaRepositorioExclusao {
  excluirPorId(id: string): Promise<Pedido | null>;
}

const NOME_METODO = 'excluirPorId';

function verificarImplementacao(adaptador: PortaRepositorioExclusao): PortaRepositorioExclusao {
  if (typeof adaptador?.[NOME_METODO] !== 'function') {
    throw new TypeError(
      `Adaptador não implementa a PortaRepositorioExclusao (método "${NOME_METODO}" ausente).`
    );
  }
  return adaptador;
}

export { verificarImplementacao };
