const StatusPedido = require('./StatusPedido');
const ErroDeValidacao = require('./erros/ErroDeValidacao');

// Entidade central do domínio (RF05/RF07). Concentra as invariantes que,
// antes da refatoração, estavam espalhadas pelas 4 Azure Functions originais
// (api/src/functions/*.js): campos obrigatórios, geração do id público e
// quais campos podem ser alterados num update parcial. Nenhuma linha aqui
// conhece MongoDB, HTTP ou Azure Functions — é a camada mais interna da
// Clean Architecture, sem dependências de fora.
const CAMPOS_ATUALIZAVEIS = Object.freeze(['cliente', 'entregaId', 'veiculoPlaca', 'status', 'previsaoEntrega']);

class Pedido {
  constructor({ id, cliente, entregaId, veiculoPlaca, status, previsaoEntrega, criadoEm, atualizadoEm }) {
    this.id = id;
    this.cliente = cliente;
    this.entregaId = entregaId;
    this.veiculoPlaca = veiculoPlaca;
    this.status = status;
    this.previsaoEntrega = previsaoEntrega;
    this.criadoEm = criadoEm;
    if (atualizadoEm !== undefined) this.atualizadoEm = atualizadoEm;
  }

  // Fábrica que aplica as regras de negócio do cadastro (usada pelo caso de
  // uso CadastrarPedidoCasoDeUso). Lança ErroDeValidacao quando os campos
  // obrigatórios (cliente, entregaId) estão ausentes — mesma regra e mesma
  // mensagem da Function original, para manter o contrato com o frontend.
  static criar({ cliente, entregaId, veiculoPlaca, status, previsaoEntrega } = {}) {
    if (!cliente || !entregaId) {
      throw new ErroDeValidacao('Campos obrigatórios no corpo da requisição: cliente, entregaId');
    }

    const statusValidado = status !== undefined ? StatusPedido.validar(status) : StatusPedido.padrao();

    return new Pedido({
      id: Pedido.gerarIdPublico(),
      cliente,
      entregaId,
      veiculoPlaca: veiculoPlaca || '',
      status: statusValidado,
      previsaoEntrega: previsaoEntrega || new Date().toISOString(),
      criadoEm: new Date().toISOString(),
    });
  }

  // Gera o id público (ex.: PED-482913). Isolado num método nomeado para que
  // a limitação conhecida (baseado em timestamp, 6 dígitos — ADR-04 e risco
  // R07 do Arc42, seção 11) fique documentada num único lugar, fácil de
  // trocar por ULID/UUID no futuro sem tocar no caso de uso.
  static gerarIdPublico() {
    return `PED-${Date.now().toString().slice(-6)}`;
  }

  static camposAtualizaveis() {
    return [...CAMPOS_ATUALIZAVEIS];
  }

  // Regra de negócio do update parcial (RF05/RF07): só os campos permitidos
  // e efetivamente enviados entram na atualização; status, se enviado,
  // precisa pertencer ao conjunto válido; sempre grava atualizadoEm.
  // Lança ErroDeValidacao se nenhum campo válido foi enviado.
  static construirAtualizacaoParcial(camposBrutos = {}) {
    const atualizacao = {};
    for (const campo of CAMPOS_ATUALIZAVEIS) {
      if (camposBrutos[campo] !== undefined) atualizacao[campo] = camposBrutos[campo];
    }

    if (Object.keys(atualizacao).length === 0) {
      throw new ErroDeValidacao(`Nenhum campo válido para atualizar. Use: ${CAMPOS_ATUALIZAVEIS.join(', ')}`);
    }

    if (atualizacao.status !== undefined) {
      atualizacao.status = StatusPedido.validar(atualizacao.status);
    }

    atualizacao.atualizadoEm = new Date().toISOString();
    return atualizacao;
  }
}

module.exports = Pedido;
