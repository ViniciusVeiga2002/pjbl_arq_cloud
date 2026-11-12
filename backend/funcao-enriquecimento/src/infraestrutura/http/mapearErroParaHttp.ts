import type { HttpResponseInit } from '@azure/functions';
import ErroDeValidacao from '../../dominio/erros/ErroDeValidacao';
import RespostaHttp from './RespostaHttp';

function mapearErroParaHttp(erro: unknown, context: { error(...args: unknown[]): void }, mensagemGenerica: string): HttpResponseInit {
  if (erro instanceof ErroDeValidacao) return RespostaHttp.requisicaoInvalida(erro.message);
  context.error(mensagemGenerica, erro);
  return RespostaHttp.erroInterno(mensagemGenerica, erro instanceof Error ? erro.message : String(erro));
}

export default mapearErroParaHttp;
