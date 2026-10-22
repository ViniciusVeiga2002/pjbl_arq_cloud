import Pedido from '../../../dominio/Pedido';
import EventosDePedido from '../../../dominio/eventos/EventosDePedido';
import CadastrarPedidoComando from './CadastrarPedidoComando';
import { verificarImplementacao, PortaRepositorioInsercao } from './PortaRepositorioInsercao';
import { verificarImplementacao as verificarPublicador, PortaPublicadorDeEventos } from '../../../aplicacao/portas/PortaPublicadorDeEventos';

// Caso de uso (camada de aplicação) do slice vertical "Cadastrar Pedido"
// (POST /api/pedidos — RF05/RF07). Orquestra: valida/cria a entidade via
// domínio, delega a persistência à porta injetada e publica o evento
// PedidoCadastrado — nunca sabe que o banco é o MongoDB nem que o evento vai
// para uma fila do Azure (Dependency Inversion Principle).
class CadastrarPedidoCasoDeUso {
  private readonly repositorioDeInsercao: PortaRepositorioInsercao;
  private readonly publicadorDeEventos: PortaPublicadorDeEventos;

  constructor(repositorioDeInsercao: PortaRepositorioInsercao, publicadorDeEventos: PortaPublicadorDeEventos) {
    this.repositorioDeInsercao = verificarImplementacao(repositorioDeInsercao);
    this.publicadorDeEventos = verificarPublicador(publicadorDeEventos);
  }

  async executar(comando: CadastrarPedidoComando): Promise<Pedido> {
    const pedido = Pedido.criar(comando);
    const pedidoGravado = await this.repositorioDeInsercao.inserir(pedido);
    await this.publicadorDeEventos.publicar(EventosDePedido.pedidoCadastrado(pedidoGravado));
    return pedidoGravado;
  }
}

export default CadastrarPedidoCasoDeUso;
