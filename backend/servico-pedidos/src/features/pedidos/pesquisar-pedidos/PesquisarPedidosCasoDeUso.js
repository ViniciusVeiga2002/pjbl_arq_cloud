const { verificarImplementacao } = require('./PortaRepositorioConsulta');

// Caso de uso (camada de aplicação) do slice vertical "Pesquisar Pedidos"
// (GET /api/pedidos — RF05/RF07). É só leitura: não há regra de domínio a
// aplicar, então o caso de uso apenas repassa o filtro à porta injetada.
class PesquisarPedidosCasoDeUso {
  constructor(repositorioDeConsulta) {
    this.repositorioDeConsulta = verificarImplementacao(repositorioDeConsulta);
  }

  async executar(filtro) {
    return this.repositorioDeConsulta.buscarComFiltro(filtro);
  }
}

module.exports = PesquisarPedidosCasoDeUso;
