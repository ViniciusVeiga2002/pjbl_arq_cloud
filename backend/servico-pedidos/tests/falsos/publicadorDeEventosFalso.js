// Publicador falso (fake), em memória: satisfaz a PortaPublicadorDeEventos
// sem precisar do Azure Storage/Azurite. Guarda os eventos publicados para
// os testes verificarem QUAL evento o caso de uso emitiu e QUANDO.
function criarPublicadorDeEventosFalso() {
  const eventosPublicados = [];
  return {
    eventosPublicados,
    async publicar(evento) {
      eventosPublicados.push(evento);
    },
  };
}

module.exports = { criarPublicadorDeEventosFalso };
