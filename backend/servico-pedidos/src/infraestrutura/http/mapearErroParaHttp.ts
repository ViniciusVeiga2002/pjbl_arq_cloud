import type { HttpResponseInit } from '@azure/functions';
import ErroDeValidacao from '../../dominio/erros/ErroDeValidacao';
import PedidoNaoEncontradoError from '../../dominio/erros/PedidoNaoEncontradoError';
import RespostaHttp from './RespostaHttp';

// Traduz um erro lançado pelo domínio/aplicação para a resposta HTTP
// correspondente. Open/Closed Principle: as 4 Functions (adaptadores HTTP)
// nunca precisam saber quais tipos de erro existem nem seus status code —
// só chamam este mapeador dentro do catch. Suportar um novo erro de domínio
// no futuro significa adicionar um "if" aqui, sem tocar em nenhuma Function.
function mapearErroParaHttp(erro: unknown, context: { error(...args: unknown[]): void }, mensagemGenerica: string): HttpResponseInit {
  if (erro instanceof ErroDeValidacao) {
    return RespostaHttp.requisicaoInvalida(erro.message);
  }
  if (erro instanceof PedidoNaoEncontradoError) {
    return RespostaHttp.naoEncontrado(erro.message);
  }

  context.error(mensagemGenerica, erro);
  return RespostaHttp.erroInterno(mensagemGenerica, erro instanceof Error ? erro.message : String(erro));
}

export default mapearErroParaHttp;
