// DTO de entrada (consulta) do slice "Listar Entregas".
class ListarEntregasFiltro {
  constructor({ situacao } = {}) {
    this.situacao = situacao || undefined;
  }
}

module.exports = ListarEntregasFiltro;
