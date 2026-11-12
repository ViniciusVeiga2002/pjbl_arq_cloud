import Entrega, { PedidoNaProjecao } from '../../dominio/Entrega';
import ErroDeConcorrencia from '../../dominio/erros/ErroDeConcorrencia';
import { obterPool, sql } from './ConexaoSqlServer';

// Adaptadores de persistência da projeção de entregas (tabela "Entregas" do
// Azure SQL pjbl_frota). Cada linha é uma Entrega; a lista dos pedidos que o
// serviço conhece por meio dos eventos fica serializada na coluna JSON
// "pedidosJson".
//
// Concorrência otimista: cada linha tem "versao". Uma entrega nova é
// INSERIDA (a chave primária barra duas inserções simultâneas); uma
// existente só é atualizada se a versão no banco ainda for a que foi lida.
// Em ambos os conflitos, lança ErroDeConcorrencia.
const CODIGO_CHAVE_DUPLICADA = [2627, 2601];

interface LinhaDeEntrega {
  id: string;
  veiculoPlaca: string;
  pedidosJson: string;
  atualizadoEm: string | null;
  versao: number;
}

function paraEntrega(linha: LinhaDeEntrega): Entrega {
  return new Entrega({
    id: linha.id,
    veiculoPlaca: linha.veiculoPlaca,
    pedidos: JSON.parse(linha.pedidosJson) as PedidoNaProjecao[],
    atualizadoEm: linha.atualizadoEm,
    versao: linha.versao,
  });
}

const COLUNAS = 'id, veiculoPlaca, pedidosJson, atualizadoEm, versao';

// Porta: PortaRepositorioDeProjecao (features/entregas/atualizar-projecao-de-entrega)
// Sem importar as portas dos slices: a infraestrutura depende só do domínio, e
// o compilador confere o encaixe estrutural quando o Composition Root monta o
// caso de uso.
function criarRepositorioDeProjecao() {
  return {
    async obterPorId(entregaId: string): Promise<Entrega | null> {
      const pool = await obterPool();
      const { recordset } = await pool
        .request()
        .input('id', sql.NVarChar(64), entregaId)
        .query(`SELECT ${COLUNAS} FROM dbo.Entregas WHERE id = @id`);
      return recordset[0] ? paraEntrega(recordset[0]) : null;
    },
    async buscarPorPedido(pedidoId: string): Promise<Entrega[]> {
      const pool = await obterPool();
      const { recordset } = await pool
        .request()
        .input('pedidoId', sql.NVarChar(64), pedidoId)
        .query(`
          SELECT ${COLUNAS} FROM dbo.Entregas e
          WHERE EXISTS (
            SELECT 1 FROM OPENJSON(e.pedidosJson) WITH (id NVARCHAR(64) '$.id') p WHERE p.id = @pedidoId
          )`);
      return recordset.map(paraEntrega);
    },
    async salvar(entrega: Entrega): Promise<void> {
      const pool = await obterPool();
      const { id, veiculoPlaca, pedidos, atualizadoEm, versao } = entrega;
      const requisicao = pool
        .request()
        .input('id', sql.NVarChar(64), id)
        .input('veiculoPlaca', sql.NVarChar(16), veiculoPlaca)
        .input('pedidosJson', sql.NVarChar(sql.MAX), JSON.stringify(pedidos))
        .input('atualizadoEm', sql.NVarChar(40), atualizadoEm)
        .input('novaVersao', sql.Int, versao + 1)
        .input('versaoLida', sql.Int, versao);

      if (versao === 0) {
        try {
          await requisicao.query(`
            INSERT INTO dbo.Entregas (id, veiculoPlaca, pedidosJson, atualizadoEm, versao)
            VALUES (@id, @veiculoPlaca, @pedidosJson, @atualizadoEm, @novaVersao)`);
        } catch (erro) {
          if (CODIGO_CHAVE_DUPLICADA.includes((erro as { number?: number }).number ?? 0)) throw new ErroDeConcorrencia(id);
          throw erro;
        }
      } else {
        const resultado = await requisicao.query(`
          UPDATE dbo.Entregas
             SET veiculoPlaca = @veiculoPlaca, pedidosJson = @pedidosJson,
                 atualizadoEm = @atualizadoEm, versao = @novaVersao
           WHERE id = @id AND versao = @versaoLida`);
        if (resultado.rowsAffected[0] === 0) throw new ErroDeConcorrencia(id);
      }
      entrega.versao = versao + 1;
    },
  };
}

// Porta: PortaRepositorioConsultaDeEntregas (features/entregas/listar-entregas)
function criarRepositorioDeConsultaDeEntregas() {
  return {
    async listar(): Promise<Entrega[]> {
      const pool = await obterPool();
      const { recordset } = await pool.request().query(`SELECT ${COLUNAS} FROM dbo.Entregas ORDER BY atualizadoEm DESC`);
      return recordset.map(paraEntrega);
    },
  };
}

export { criarRepositorioDeProjecao, criarRepositorioDeConsultaDeEntregas };
