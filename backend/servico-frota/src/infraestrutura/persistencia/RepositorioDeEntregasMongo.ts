import Entrega, { DadosDaEntrega } from '../../dominio/Entrega';
import ErroDeConcorrencia from '../../dominio/erros/ErroDeConcorrencia';
import { obterColecaoDeEntregas } from './ConexaoMongoDB';

// Adaptadores de persistência da projeção de entregas (coleção "entregas"
// do banco pjbl_frota). Cada documento é uma Entrega com a lista dos
// pedidos que o serviço conhece por meio dos eventos.
//
// Concorrência otimista: cada documento tem "versao". Uma entrega nova é
// INSERIDA (o índice único em "id" barra duas inserções simultâneas); uma
// existente só é substituída se a versão no banco ainda for a que foi lida.
// Em ambos os conflitos, lança ErroDeConcorrencia.
const CODIGO_CHAVE_DUPLICADA = 11000;

function paraEntrega(documento: DadosDaEntrega): Entrega;
function paraEntrega(documento: DadosDaEntrega | null): Entrega | null;
function paraEntrega(documento: DadosDaEntrega | null): Entrega | null {
  return documento ? new Entrega(documento) : null;
}

// Porta: PortaRepositorioDeProjecao (features/entregas/atualizar-projecao-de-entrega)
// Sem importar as portas dos slices: a infraestrutura depende só do domínio, e
// o compilador confere o encaixe estrutural quando o Composition Root monta o
// caso de uso.
function criarRepositorioDeProjecao() {
  return {
    async obterPorId(entregaId: string): Promise<Entrega | null> {
      const colecao = await obterColecaoDeEntregas();
      return paraEntrega(await colecao.findOne({ id: entregaId }, { projection: { _id: 0 } }));
    },
    async buscarPorPedido(pedidoId: string): Promise<Entrega[]> {
      const colecao = await obterColecaoDeEntregas();
      const documentos = await colecao.find({ 'pedidos.id': pedidoId }, { projection: { _id: 0 } }).toArray();
      return documentos.map((documento) => paraEntrega(documento));
    },
    async salvar(entrega: Entrega): Promise<void> {
      const colecao = await obterColecaoDeEntregas();
      const { id, veiculoPlaca, pedidos, atualizadoEm, versao } = entrega;
      const documento: DadosDaEntrega = { id, veiculoPlaca, pedidos, atualizadoEm, versao: versao + 1 };

      if (versao === 0) {
        try {
          await colecao.insertOne(documento);
        } catch (erro) {
          if ((erro as { code?: number }).code === CODIGO_CHAVE_DUPLICADA) throw new ErroDeConcorrencia(id);
          throw erro;
        }
      } else {
        const { matchedCount } = await colecao.replaceOne({ id, versao }, documento);
        if (matchedCount === 0) throw new ErroDeConcorrencia(id);
      }
      entrega.versao = versao + 1;
    },
  };
}

// Porta: PortaRepositorioConsultaDeEntregas (features/entregas/listar-entregas)
function criarRepositorioDeConsultaDeEntregas() {
  return {
    async listar(): Promise<Entrega[]> {
      const colecao = await obterColecaoDeEntregas();
      const documentos = await colecao.find({}, { projection: { _id: 0 } }).sort({ atualizadoEm: -1 }).toArray();
      return documentos.map((documento) => paraEntrega(documento));
    },
  };
}

export { criarRepositorioDeProjecao, criarRepositorioDeConsultaDeEntregas };
