// Publicador falso (fake), em memória: satisfaz a PortaPublicadorDeEventos
// sem precisar do Azure Storage/Azurite. Guarda os eventos publicados para
// os testes verificarem QUAL evento o caso de uso emitiu e QUANDO.
import { PortaPublicadorDeEventos } from '../../src/aplicacao/portas/PortaPublicadorDeEventos';
import { EventoDePedido } from '../../src/dominio/eventos/EventosDePedido';

function criarPublicadorDeEventosFalso(): PortaPublicadorDeEventos & { eventosPublicados: EventoDePedido[] } {
  const eventosPublicados: EventoDePedido[] = [];
  return {
    eventosPublicados,
    async publicar(evento: EventoDePedido) {
      eventosPublicados.push(evento);
    },
  };
}

export { criarPublicadorDeEventosFalso };
