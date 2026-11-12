import Veiculo from '../../dominio/Veiculo';
import { obterPool, sql } from './ConexaoSqlServer';

// Adaptadores de persistência de veículos (tabela "Veiculos" do Azure SQL
// pjbl_frota). Uma fábrica por porta (Interface Segregation), como no
// servico-pedidos.

// Porta: PortaRepositorioDeLeituras (features/veiculos/registrar-telemetria)
// Sem importar as portas dos slices: a infraestrutura depende só do domínio, e
// o compilador confere o encaixe estrutural quando o Composition Root monta o
// caso de uso.
function criarRepositorioDeLeituras() {
  return {
    async salvarUltimaLeitura(veiculo: Veiculo): Promise<Veiculo> {
      const pool = await obterPool();
      // Upsert pela placa (MERGE com HOLDLOCK evita corrida entre duas leituras simultâneas).
      await pool
        .request()
        .input('placa', sql.NVarChar(16), veiculo.placa)
        .input('motorista', sql.NVarChar(120), veiculo.motorista)
        .input('lat', sql.Float, veiculo.lat)
        .input('lng', sql.Float, veiculo.lng)
        .input('velocidade', sql.Float, veiculo.velocidade)
        .input('status', sql.NVarChar(40), veiculo.status)
        .input('registradoEm', sql.NVarChar(40), veiculo.registradoEm)
        .query(`
          MERGE dbo.Veiculos WITH (HOLDLOCK) AS alvo
          USING (SELECT @placa AS placa) AS origem ON alvo.placa = origem.placa
          WHEN MATCHED THEN UPDATE SET motorista = @motorista, lat = @lat, lng = @lng,
            velocidade = @velocidade, status = @status, registradoEm = @registradoEm
          WHEN NOT MATCHED THEN INSERT (placa, motorista, lat, lng, velocidade, status, registradoEm)
            VALUES (@placa, @motorista, @lat, @lng, @velocidade, @status, @registradoEm);
        `);
      return veiculo;
    },
  };
}

// Porta: PortaRepositorioConsultaDeVeiculos (features/veiculos/listar-veiculos)
function criarRepositorioDeConsultaDeVeiculos() {
  return {
    async listar(criterios: { status?: string } = {}): Promise<Veiculo[]> {
      const pool = await obterPool();
      const requisicao = pool.request();
      let consulta = 'SELECT placa, motorista, lat, lng, velocidade, status, registradoEm FROM dbo.Veiculos';
      if (criterios.status) {
        requisicao.input('status', sql.NVarChar(40), criterios.status);
        consulta += ' WHERE status = @status';
      }
      const { recordset } = await requisicao.query(`${consulta} ORDER BY placa`);
      return recordset.map((linha) => new Veiculo(linha));
    },
  };
}

export { criarRepositorioDeLeituras, criarRepositorioDeConsultaDeVeiculos };
