import { app } from '@azure/functions';
import RegistrarTelemetriaComando from './RegistrarTelemetriaComando';
import tratarErroDeMensagem from '../../../infraestrutura/mensageria/tratarErroDeMensagem';
import { criarRegistrarTelemetriaCasoDeUso } from '../../../composicao/ContainerDeDependencias';

// Adaptador de entrada orientado a eventos (Queue Trigger): cada mensagem da
// fila "telemetria-veiculos" é uma leitura enviada pelo dispositivo OBD2/GPS
// do veículo (hoje simulado por scripts/simular-telemetria.ts). Não há
// endpoint HTTP para isso: o dispositivo publica e segue em frente, e este
// serviço processa no seu ritmo (desacoplamento temporal).
app.storageQueue('registrarTelemetria', {
  queueName: 'telemetria-veiculos',
  connection: 'EVENTOS_STORAGE',
  handler: async (evento, context) => {
    try {
      const comando = RegistrarTelemetriaComando.aPartirDoEvento(evento);
      const veiculo = await criarRegistrarTelemetriaCasoDeUso().executar(comando);
      context.log(`Telemetria registrada: ${veiculo.placa} (${veiculo.velocidade} km/h, ${veiculo.status})`);
    } catch (erro) {
      tratarErroDeMensagem(erro, context, evento);
    }
  },
});
