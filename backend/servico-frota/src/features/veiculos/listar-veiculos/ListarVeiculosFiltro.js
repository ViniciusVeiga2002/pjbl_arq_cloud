// DTO de entrada (consulta) do slice "Listar Veículos".
class ListarVeiculosFiltro {
  constructor({ status } = {}) {
    this.status = status || undefined;
  }
}

module.exports = ListarVeiculosFiltro;
