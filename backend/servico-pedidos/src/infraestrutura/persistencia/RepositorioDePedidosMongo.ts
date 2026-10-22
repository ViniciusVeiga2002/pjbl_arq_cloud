import { Filter } from 'mongodb';
import Pedido, { AtualizacaoParcialDePedido } from '../../dominio/Pedido';
import { obterColecaoDePedidos } from './ConexaoMongoDB';

// Adaptador de persistência (camada de infraestrutura da Clean Architecture).
// Em vez de um único "repositório" genérico com os 4 métodos de CRUD
// (o que violaria o Interface Segregation Principle, já que cada caso de
// uso só precisa de UM método), expomos 4 fábricas pequenas — uma por porta
// declarada em cada slice de features/pedidos/*/Porta*.ts. Cada objeto
// devolvido tem literalmente um único método: o caso de uso correspondente
// não tem como, nem por engano, chamar uma operação que não devia conhecer.
//
// Só este arquivo conhece a sintaxe de consulta do MongoDB ($regex, $set,
// findOneAndUpdate, etc.) — é a fronteira que a Regra de Dependência da
// Clean Architecture exige: Domínio e Aplicação (casos de uso) nunca
// importam este módulo diretamente, apenas a composição (ver
// composicao/ContainerDeDependencias.ts) o conecta às portas.

// Critérios de busca no vocabulário da aplicação (ver PortaRepositorioConsulta).
type CriteriosDeBusca = { id?: string; entregaId?: string; status?: string; clienteContendo?: string };

// As funções abaixo NÃO importam as portas dos slices: a infraestrutura só
// depende do domínio, e o encaixe com cada porta é conferido pelo compilador
// (tipagem estrutural) no ponto em que o Composition Root monta o caso de uso.

// Porta: PortaRepositorioInsercao (features/pedidos/cadastrar-pedido)
function criarRepositorioDeInsercaoDePedidos() {
  return {
    async inserir(pedido: Pedido): Promise<Pedido> {
      const colecao = await obterColecaoDePedidos();
      // Passamos uma cópia para o driver: o MongoDB adiciona um campo "_id"
      // (ObjectId) ao objeto inserido por referência, e o domínio não deve
      // nunca carregar esse detalhe de persistência (ver seção 8.8 do Arc42).
      await colecao.insertOne({ ...pedido });
      return pedido;
    },
  };
}

// Porta: PortaRepositorioConsulta (features/pedidos/pesquisar-pedidos)
function criarRepositorioDeConsultaDePedidos() {
  return {
    async buscarComFiltro(criterios: CriteriosDeBusca = {}): Promise<Pedido[]> {
      const colecao = await obterColecaoDePedidos();

      // Traduz os critérios genéricos (vocabulário da aplicação) para o
      // filtro específico do MongoDB — é aqui, e só aqui, que "$regex"
      // aparece, para não deixar sintaxe de banco escapar para o caso de uso.
      const filtro: Record<string, unknown> = {};
      if (criterios.id) filtro.id = criterios.id;
      if (criterios.entregaId) filtro.entregaId = criterios.entregaId;
      if (criterios.status) filtro.status = criterios.status;
      if (criterios.clienteContendo) {
        filtro.cliente = { $regex: criterios.clienteContendo, $options: 'i' };
      }

      return colecao
        .find(filtro as Filter<Pedido>, { projection: { _id: 0 } })
        .sort({ criadoEm: -1 })
        .toArray();
    },
  };
}

// Porta: PortaRepositorioAtualizacao (features/pedidos/alterar-pedido)
function criarRepositorioDeAtualizacaoDePedidos() {
  return {
    async atualizarPorId(id: string, camposParciais: AtualizacaoParcialDePedido): Promise<Pedido | null> {
      const colecao = await obterColecaoDePedidos();
      return colecao.findOneAndUpdate(
        { id },
        { $set: camposParciais },
        { returnDocument: 'after', includeResultMetadata: false, projection: { _id: 0 } }
      );
    },
  };
}

// Porta: PortaRepositorioExclusao (features/pedidos/excluir-pedido)
function criarRepositorioDeExclusaoDePedidos() {
  return {
    async excluirPorId(id: string): Promise<Pedido | null> {
      const colecao = await obterColecaoDePedidos();
      return colecao.findOneAndDelete({ id }, { includeResultMetadata: false, projection: { _id: 0 } });
    },
  };
}

export {
  criarRepositorioDeInsercaoDePedidos,
  criarRepositorioDeConsultaDePedidos,
  criarRepositorioDeAtualizacaoDePedidos,
  criarRepositorioDeExclusaoDePedidos,
};
