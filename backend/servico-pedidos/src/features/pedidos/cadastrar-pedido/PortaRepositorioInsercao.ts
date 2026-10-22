// Porta (interface) exigida pelo caso de uso CadastrarPedidoCasoDeUso —
// Dependency Inversion Principle: o caso de uso depende desta abstração,
// não da implementação concreta em MongoDB
// (infraestrutura/persistencia/RepositorioDePedidosMongo.ts).
//
// Interface Segregation Principle: a porta tem exatamente o método que este
// caso de uso usa — "inserir". Não há "buscar", "atualizar" ou "excluir"
// aqui; quem implementa esta porta não é forçado a conhecer operações que
// não lhe interessam.
//
// A forma contratual aqui é dupla: (1) a interface TypeScript abaixo, checada
// na compilação; (2) verificarImplementacao(), que garante, em tempo de
// execução, que o adaptador injetado de fato expõe o método esperado.

import Pedido from '../../../dominio/Pedido';

export interface PortaRepositorioInsercao {
  inserir(pedido: Pedido): Promise<Pedido>;
}

const NOME_METODO = 'inserir';

function verificarImplementacao(adaptador: PortaRepositorioInsercao): PortaRepositorioInsercao {
  if (typeof adaptador?.[NOME_METODO] !== 'function') {
    throw new TypeError(
      `Adaptador não implementa a PortaRepositorioInsercao (método "${NOME_METODO}" ausente).`
    );
  }
  return adaptador;
}

export { verificarImplementacao };
