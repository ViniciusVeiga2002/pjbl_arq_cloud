// Fábrica de eventos de pedido para os testes, no mesmo formato publicado
// pelo servico-pedidos na fila "pedidos-eventos".
function eventoDePedido(tipo, ocorridoEm, dados) {
  return {
    tipo,
    versao: 1,
    ocorridoEm,
    dados: { veiculoPlaca: 'ABC-1D23', status: 'Aguardando coleta', previsaoEntrega: '2026-10-20T18:00:00.000Z', ...dados },
  };
}

module.exports = { eventoDePedido };
