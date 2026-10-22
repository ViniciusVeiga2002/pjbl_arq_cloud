import type { HttpResponseInit } from '@azure/functions';
import ErroDeServicoRemoto from '../../aplicacao/erros/ErroDeServicoRemoto';
import RespostaHttp from './RespostaHttp';

// Erro de um microsserviço → resposta do BFF:
// - 4xx do serviço (ex.: 400 validação, 404 não encontrado) é erro do
//   usuário: repassa o mesmo status e a mesma mensagem para a tela.
// - 5xx, timeout ou serviço fora do ar viram 502/504 (Bad Gateway / Gateway
//   Timeout) — a falha é de uma dependência, não do BFF.
function mapearErroParaHttp(erro: unknown, context: { error(...args: unknown[]): void }): HttpResponseInit {
  if (erro instanceof ErroDeServicoRemoto) {
    if (erro.ehErroDoCliente()) return RespostaHttp.erro(erro.status, erro.message);
    context.error(`Falha em ${erro.servico}`, erro.message);
    return RespostaHttp.erro(erro.status === 504 ? 504 : 502, erro.message);
  }
  context.error('Falha inesperada no BFF', erro);
  return RespostaHttp.erro(500, 'Falha inesperada no BFF');
}

export default mapearErroParaHttp;
