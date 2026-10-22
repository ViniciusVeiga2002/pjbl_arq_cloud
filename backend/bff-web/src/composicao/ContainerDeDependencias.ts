import type { HttpRequest, InvocationContext } from '@azure/functions';
import { criarClienteServicoDePedidos } from '../infraestrutura/clientes/ClienteServicoDePedidos';
import { criarClienteServicoDeFrota } from '../infraestrutura/clientes/ClienteServicoDeFrota';

import PesquisarPedidosCasoDeUso from '../features/pedidos/pesquisar-pedidos/PesquisarPedidosCasoDeUso';
import CadastrarPedidoCasoDeUso from '../features/pedidos/cadastrar-pedido/CadastrarPedidoCasoDeUso';
import AlterarPedidoCasoDeUso from '../features/pedidos/alterar-pedido/AlterarPedidoCasoDeUso';
import ExcluirPedidoCasoDeUso from '../features/pedidos/excluir-pedido/ExcluirPedidoCasoDeUso';
import ConcluirEntregaCasoDeUso from '../features/pedidos/concluir-entrega/ConcluirEntregaCasoDeUso';
import ObterPainelFrotaCasoDeUso from '../features/painel/obter-painel-frota/ObterPainelFrotaCasoDeUso';

// Composition Root do BFF: liga cada caso de uso aos clientes HTTP dos
// microsserviços. O correlation-id recebido do API Gateway é repassado aos
// clientes para seguir até os serviços.
function correlationIdDe(request: HttpRequest): string | undefined {
  return request.headers.get('x-correlation-id') || undefined;
}

export const criarPesquisarPedidosCasoDeUso = (request: HttpRequest, context: InvocationContext) =>
    new PesquisarPedidosCasoDeUso(
      criarClienteServicoDePedidos(correlationIdDe(request)),
      criarClienteServicoDeFrota(correlationIdDe(request)),
      context
    );

export const criarCadastrarPedidoCasoDeUso = (request: HttpRequest) =>
    new CadastrarPedidoCasoDeUso(criarClienteServicoDePedidos(correlationIdDe(request)));

export const criarAlterarPedidoCasoDeUso = (request: HttpRequest) =>
    new AlterarPedidoCasoDeUso(criarClienteServicoDePedidos(correlationIdDe(request)));

export const criarExcluirPedidoCasoDeUso = (request: HttpRequest) =>
    new ExcluirPedidoCasoDeUso(criarClienteServicoDePedidos(correlationIdDe(request)));

export const criarConcluirEntregaCasoDeUso = (request: HttpRequest) =>
    new ConcluirEntregaCasoDeUso(criarClienteServicoDePedidos(correlationIdDe(request)));

export const criarObterPainelFrotaCasoDeUso = (request: HttpRequest) =>
    new ObterPainelFrotaCasoDeUso(criarClienteServicoDeFrota(correlationIdDe(request)));
