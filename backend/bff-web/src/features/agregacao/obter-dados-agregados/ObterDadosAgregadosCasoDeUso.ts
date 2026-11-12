import { exigirServicoDePedidos, PortaServicoDePedidos } from '../../../aplicacao/portas/PortaServicoDePedidos';
import { exigirServicoDeFrota, PortaServicoDeFrota } from '../../../aplicacao/portas/PortaServicoDeFrota';
import { exigirFuncaoDeEnriquecimento, PortaFuncaoDeEnriquecimento } from '../../../aplicacao/portas/PortaFuncaoDeEnriquecimento';

// Caso de uso do BFF "Dados agregados" (GET /aggregated-data). Um único
// response reúne o que vem de três origens:
//   1. servico-pedidos (MongoDB Atlas)   → pedidos
//   2. servico-frota   (Azure SQL)       → veículos e entregas
//   3. funcao-enriquecimento (Azure Function) → risco de atraso por pedido
// As duas primeiras chamadas são paralelas; a Function depende delas. Se a
// Function falhar, a resposta sai mesmo assim (com "enriquecimento": null e
// um aviso) — degradação graciosa em vez de derrubar a tela inteira.
class ObterDadosAgregadosCasoDeUso {
  private readonly servicoDePedidos: Pick<PortaServicoDePedidos, 'pesquisar'>;
  private readonly servicoDeFrota: Pick<PortaServicoDeFrota, 'listarVeiculos' | 'listarEntregas'>;
  private readonly funcaoDeEnriquecimento: PortaFuncaoDeEnriquecimento;

  constructor(
    servicoDePedidos: Pick<PortaServicoDePedidos, 'pesquisar'>,
    servicoDeFrota: Pick<PortaServicoDeFrota, 'listarVeiculos' | 'listarEntregas'>,
    funcaoDeEnriquecimento: PortaFuncaoDeEnriquecimento
  ) {
    this.servicoDePedidos = exigirServicoDePedidos(servicoDePedidos, ['pesquisar']);
    this.servicoDeFrota = exigirServicoDeFrota(servicoDeFrota, ['listarVeiculos', 'listarEntregas']);
    this.funcaoDeEnriquecimento = exigirFuncaoDeEnriquecimento(funcaoDeEnriquecimento);
  }

  async executar() {
    const [pedidos, veiculos, entregas] = await Promise.all([
      this.servicoDePedidos.pesquisar(),
      this.servicoDeFrota.listarVeiculos(),
      this.servicoDeFrota.listarEntregas(),
    ]);

    const avisos: string[] = [];
    let enriquecimento = null;
    try {
      enriquecimento = await this.funcaoDeEnriquecimento.calcularRisco(pedidos, veiculos);
    } catch (erro) {
      avisos.push(`funcao-enriquecimento indisponível: ${erro instanceof Error ? erro.message : String(erro)}`);
    }

    return {
      geradoEm: new Date().toISOString(),
      fontes: { pedidos: 'servico-pedidos (MongoDB)', frota: 'servico-frota (Azure SQL)', enriquecimento: 'funcao-enriquecimento (Azure Function)' },
      pedidos,
      frota: { veiculos, entregas },
      enriquecimento,
      avisos,
    };
  }
}

export default ObterDadosAgregadosCasoDeUso;
