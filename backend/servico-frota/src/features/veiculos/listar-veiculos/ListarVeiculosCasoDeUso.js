const { verificarImplementacao } = require('./PortaRepositorioConsultaDeVeiculos');

// Caso de uso do slice "Listar Veículos" (RF06 — mapa da frota): só leitura.
class ListarVeiculosCasoDeUso {
  constructor(repositorioDeConsulta) {
    this.repositorioDeConsulta = verificarImplementacao(repositorioDeConsulta);
  }

  async executar(filtro) {
    return this.repositorioDeConsulta.listar(filtro);
  }
}

module.exports = ListarVeiculosCasoDeUso;
