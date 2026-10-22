import Veiculo from '../../dominio/Veiculo';
import { obterColecaoDeVeiculos } from './ConexaoMongoDB';

// Adaptadores de persistência de veículos (coleção "veiculos" do banco
// pjbl_frota). Uma fábrica por porta (Interface Segregation), como no
// servico-pedidos.

// Porta: PortaRepositorioDeLeituras (features/veiculos/registrar-telemetria)
// Sem importar as portas dos slices: a infraestrutura depende só do domínio, e
// o compilador confere o encaixe estrutural quando o Composition Root monta o
// caso de uso.
function criarRepositorioDeLeituras() {
  return {
    async salvarUltimaLeitura(veiculo: Veiculo): Promise<Veiculo> {
      const colecao = await obterColecaoDeVeiculos();
      await colecao.replaceOne({ placa: veiculo.placa }, { ...veiculo }, { upsert: true });
      return veiculo;
    },
  };
}

// Porta: PortaRepositorioConsultaDeVeiculos (features/veiculos/listar-veiculos)
function criarRepositorioDeConsultaDeVeiculos() {
  return {
    async listar(criterios: { status?: string } = {}): Promise<Veiculo[]> {
      const colecao = await obterColecaoDeVeiculos();
      const filtro = criterios.status ? { status: criterios.status } : {};
      const documentos = await colecao.find(filtro, { projection: { _id: 0 } }).sort({ placa: 1 }).toArray();
      return documentos.map((documento) => new Veiculo(documento));
    },
  };
}

export { criarRepositorioDeLeituras, criarRepositorioDeConsultaDeVeiculos };
