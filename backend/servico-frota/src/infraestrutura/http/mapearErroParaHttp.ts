import type { HttpResponseInit } from '@azure/functions';
import ErroDeValidacao from '../../dominio/erros/ErroDeValidacao';
import RespostaHttp from './RespostaHttp';

// Traduz erro de domínio → status HTTP (Open/Closed: um novo tipo de erro
// entra aqui, sem tocar nas Functions).
function mapearErroParaHttp(erro: unknown, context: { error(...args: unknown[]): void }, mensagemGenerica: string): HttpResponseInit {
  if (erro instanceof ErroDeValidacao) {
    return RespostaHttp.requisicaoInvalida(erro.message);
  }
  context.error(mensagemGenerica, erro);
  return RespostaHttp.erroInterno(mensagemGenerica, erro instanceof Error ? erro.message : String(erro));
}

export default mapearErroParaHttp;
