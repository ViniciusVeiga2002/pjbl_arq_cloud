import { app } from '@azure/functions';
import { EventoDePedidoRecebido } from '../../../dominio/Entrega';
import tratarErroDeMensagem from '../../../infraestrutura/mensageria/tratarErroDeMensagem';
import { criarAtualizarProjecaoDeEntregaCasoDeUso } from '../../../composicao/ContainerDeDependencias';

// Adaptador de entrada orientado a eventos (Queue Trigger): consome a fila
// "pedidos-eventos", onde o servico-pedidos publica PedidoCadastrado,
// PedidoAlterado e PedidoExcluido. É assim — e só assim — que o
// servico-frota fica sabendo dos pedidos: nenhuma chamada HTTP ao outro
// serviço, nenhum acesso ao banco dele.
app.storageQueue('atualizarProjecaoDeEntrega', {
  queueName: 'pedidos-eventos',
  connection: 'EVENTOS_STORAGE',
  handler: async (mensagem, context) => {
    const evento = mensagem as EventoDePedidoRecebido;
    try {
      const { aplicado, entrega } = await criarAtualizarProjecaoDeEntregaCasoDeUso().executar(evento);
      context.log(
        `${evento.tipo} ${evento.dados.id} → entrega ${entrega.id}: ` +
        (aplicado ? `situação "${entrega.situacao}"` : 'ignorado (evento mais antigo que o já aplicado)')
      );
    } catch (erro) {
      tratarErroDeMensagem(erro, context, evento);
    }
  },
});
