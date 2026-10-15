const ErroDeValidacao = require('./erros/ErroDeValidacao');

// Value Object: representa o conjunto fechado de status possíveis de um
// Pedido. Antes da refatoração, o status era uma string livre aceita sem
// validação pelas Functions (o conjunto só era imposto pela UI, em
// frontend/src/pages/PedidosEntrega.jsx, STATUS_OPCOES). Centralizar a regra
// aqui dá ao back-end a mesma garantia, sem duplicar a lista em cada Function.
const AGUARDANDO_COLETA = 'Aguardando coleta';
const EM_ROTA = 'Em rota';
const ENTREGUE = 'Entregue';
const ATRASADO = 'Atrasado';

const VALORES_VALIDOS = Object.freeze([AGUARDANDO_COLETA, EM_ROTA, ENTREGUE, ATRASADO]);

const StatusPedido = Object.freeze({
  AGUARDANDO_COLETA,
  EM_ROTA,
  ENTREGUE,
  ATRASADO,

  padrao() {
    return AGUARDANDO_COLETA;
  },

  valoresValidos() {
    return [...VALORES_VALIDOS];
  },

  // Lança ErroDeValidacao (regra de domínio) se `valor` não pertencer ao
  // conjunto fechado; devolve o próprio valor quando válido.
  validar(valor) {
    if (!VALORES_VALIDOS.includes(valor)) {
      throw new ErroDeValidacao(
        `Status inválido: "${valor}". Use um dos seguintes: ${VALORES_VALIDOS.join(', ')}`
      );
    }
    return valor;
  },
});

module.exports = StatusPedido;
