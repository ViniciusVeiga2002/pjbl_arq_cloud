// Porta (interface) exigida pelo caso de uso AlterarPedidoCasoDeUso —
// Dependency Inversion Principle: o caso de uso depende desta abstração,
// não da implementação concreta em MongoDB
// (infraestrutura/persistencia/RepositorioDePedidosMongo.ts).
//
// Interface Segregation Principle: a porta tem exatamente o método que este
// caso de uso usa — "atualizarPorId". Não há "inserir", "buscar" ou
// "excluir" aqui.
//
import Pedido, { AtualizacaoParcialDePedido } from '../../../dominio/Pedido';

export interface PortaRepositorioAtualizacao {
  atualizarPorId(id: string, camposParciais: AtualizacaoParcialDePedido): Promise<Pedido | null>;
}

const NOME_METODO = 'atualizarPorId';

function verificarImplementacao(adaptador: PortaRepositorioAtualizacao): PortaRepositorioAtualizacao {
  if (typeof adaptador?.[NOME_METODO] !== 'function') {
    throw new TypeError(
      `Adaptador não implementa a PortaRepositorioAtualizacao (método "${NOME_METODO}" ausente).`
    );
  }
  return adaptador;
}

export { verificarImplementacao };
