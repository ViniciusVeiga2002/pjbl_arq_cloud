// DTO de entrada (consulta) do slice "Listar Veículos".
class ListarVeiculosFiltro {
  readonly status?: string;

  constructor({ status }: { status?: string | null } = {}) {
    this.status = status || undefined;
  }
}

export default ListarVeiculosFiltro;
