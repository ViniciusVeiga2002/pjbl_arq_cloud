const { verificarImplementacao } = require('./PortaRepositorioConsultaDeEntregas');

// Caso de uso do slice "Listar Entregas" (RF07): devolve o resumo de cada
// entrega da projeção local. O filtro por situação é aplicado sobre o resumo
// porque a situação é CALCULADA pelo domínio (Entrega.situacao()), não é um
// campo gravado no banco.
class ListarEntregasCasoDeUso {
  constructor(repositorioDeConsulta) {
    this.repositorioDeConsulta = verificarImplementacao(repositorioDeConsulta);
  }

  async executar(filtro = {}) {
    const entregas = await this.repositorioDeConsulta.listar();
    const resumos = entregas.map((entrega) => entrega.resumo()).filter((r) => r.totalDePedidos > 0);
    return filtro.situacao ? resumos.filter((r) => r.situacao === filtro.situacao) : resumos;
  }
}

module.exports = ListarEntregasCasoDeUso;
