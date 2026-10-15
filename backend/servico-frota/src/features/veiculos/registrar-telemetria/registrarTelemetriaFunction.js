const { app } = require('@azure/functions');
const RegistrarTelemetriaComando = require('./RegistrarTelemetriaComando');
const tratarErroDeMensagem = require('../../../infraestrutura/mensageria/tratarErroDeMensagem');
const { criarRegistrarTelemetriaCasoDeUso } = require('../../../composicao/ContainerDeDependencias');

// Adaptador de entrada orientado a eventos (Queue Trigger): cada mensagem da
// fila "telemetria-veiculos" é uma leitura enviada pelo dispositivo OBD2/GPS
// do veículo (hoje simulado por scripts/simular-telemetria.js). Não há
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
