// Falha ao chamar um microsserviço. "status" é o código HTTP devolvido por
// ele (400, 404...) ou 502/504 quando o serviço não respondeu. O BFF
// repassa 4xx ao cliente (erro do usuário) e converte o resto em 502.
class ErroDeServicoRemoto extends Error {
  constructor(servico, status, mensagem) {
    super(mensagem);
    this.name = 'ErroDeServicoRemoto';
    this.servico = servico;
    this.status = status;
  }

  ehErroDoCliente() {
    return this.status >= 400 && this.status < 500;
  }
}

module.exports = ErroDeServicoRemoto;
