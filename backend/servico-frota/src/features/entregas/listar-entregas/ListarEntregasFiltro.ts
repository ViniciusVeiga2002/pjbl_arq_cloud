// DTO de entrada (consulta) do slice "Listar Entregas".
class ListarEntregasFiltro {
  readonly situacao?: string;

  constructor({ situacao }: { situacao?: string | null } = {}) {
    this.situacao = situacao || undefined;
  }
}

export default ListarEntregasFiltro;
