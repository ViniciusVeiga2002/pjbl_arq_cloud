// A entrega foi gravada por outro processamento entre a leitura e a escrita
// (controle de concorrência otimista). Acontece quando dois eventos da mesma
// entrega são consumidos em paralelo — o Queue Trigger processa mensagens em
// lote. Quem recebe este erro relê a entrega e reaplica o evento.
class ErroDeConcorrencia extends Error {
  constructor(entregaId) {
    super(`A entrega ${entregaId} foi alterada por outro processamento.`);
    this.name = 'ErroDeConcorrencia';
    this.entregaId = entregaId;
  }
}

module.exports = ErroDeConcorrencia;
