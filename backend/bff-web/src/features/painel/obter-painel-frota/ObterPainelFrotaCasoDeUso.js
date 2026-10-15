const { exigirServicoDeFrota } = require('../../../aplicacao/portas/PortaServicoDeFrota');

// Caso de uso do BFF "Painel da Frota" (tela Mapa da Frota). Uma única
// chamada do navegador devolve tudo que a tela mostra: veículos, resumo das
// entregas e os indicadores do topo — já calculados, no formato da tela.
class ObterPainelFrotaCasoDeUso {
  constructor(servicoDeFrota) {
    this.servicoDeFrota = exigirServicoDeFrota(servicoDeFrota, ['listarVeiculos', 'listarEntregas']);
  }

  async executar() {
    const [veiculos, entregas] = await Promise.all([
      this.servicoDeFrota.listarVeiculos(),
      this.servicoDeFrota.listarEntregas(),
    ]);

    return {
      indicadores: {
        veiculos: veiculos.length,
        veiculosEmAlerta: veiculos.filter((v) => v.status === 'alerta-velocidade').length,
        entregasEmAndamento: entregas.filter((e) => e.situacao !== 'Concluída').length,
        entregasComAtraso: entregas.filter((e) => e.situacao === 'Com atraso').length,
      },
      veiculos,
      entregas,
    };
  }
}

module.exports = ObterPainelFrotaCasoDeUso;
