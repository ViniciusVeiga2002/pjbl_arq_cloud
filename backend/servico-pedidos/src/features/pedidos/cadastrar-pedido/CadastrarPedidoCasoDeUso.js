const Pedido = require('../../../dominio/Pedido');
const EventosDePedido = require('../../../dominio/eventos/EventosDePedido');
const { verificarImplementacao } = require('./PortaRepositorioInsercao');
const { verificarImplementacao: verificarPublicador } = require('../../../aplicacao/portas/PortaPublicadorDeEventos');

// Caso de uso (camada de aplicação) do slice vertical "Cadastrar Pedido"
// (POST /api/pedidos — RF05/RF07). Orquestra: valida/cria a entidade via
// domínio, delega a persistência à porta injetada e publica o evento
// PedidoCadastrado — nunca sabe que o banco é o MongoDB nem que o evento vai
// para uma fila do Azure (Dependency Inversion Principle).
class CadastrarPedidoCasoDeUso {
  constructor(repositorioDeInsercao, publicadorDeEventos) {
    this.repositorioDeInsercao = verificarImplementacao(repositorioDeInsercao);
    this.publicadorDeEventos = verificarPublicador(publicadorDeEventos);
  }

  async executar(comando) {
    const pedido = Pedido.criar(comando);
    const pedidoGravado = await this.repositorioDeInsercao.inserir(pedido);
    await this.publicadorDeEventos.publicar(EventosDePedido.pedidoCadastrado(pedidoGravado));
    return pedidoGravado;
  }
}

module.exports = CadastrarPedidoCasoDeUso;
