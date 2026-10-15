const { QueueClient } = require('@azure/storage-queue');
const { randomUUID } = require('node:crypto');

// Adaptador de mensageria (camada de infraestrutura): implementa a
// PortaPublicadorDeEventos enviando cada evento para a fila
// "pedidos-eventos" do Azure Queue Storage. O servico-frota consome essa
// fila com um Queue Trigger (Arquitetura Orientada a Eventos) — o serviço de
// pedidos não sabe quem consome nem precisa que o consumidor esteja no ar.
//
// EVENTOS_STORAGE é a connection string da conta de armazenamento:
// - localmente: "UseDevelopmentStorage=true" (emulador Azurite)
// - no Azure: Application setting do Function App (ver guia de recursos)
const NOME_DA_FILA = 'pedidos-eventos';
const ORIGEM = 'servico-pedidos';

let filaPromise = null;

function obterFila() {
  if (!filaPromise) {
    const conexao = process.env.EVENTOS_STORAGE;
    if (!conexao) {
      throw new Error('Variável de ambiente EVENTOS_STORAGE não configurada.');
    }
    const fila = new QueueClient(conexao, NOME_DA_FILA);
    filaPromise = fila.createIfNotExists().then(() => fila);
  }
  return filaPromise;
}

// O Queue Trigger do Azure Functions espera, por padrão, mensagens em
// Base64 (host.json → extensions.queues.messageEncoding = "base64").
function serializar(mensagem) {
  return Buffer.from(JSON.stringify(mensagem), 'utf8').toString('base64');
}

// Publicação "melhor esforço": se a fila estiver fora do ar, o pedido já
// foi gravado no banco e a requisição do usuário NÃO falha por causa disso
// — o erro é registrado no log. A garantia de entrega forte exigiria o
// padrão Transactional Outbox (registrado como risco no Arc42, seção 11).
function criarPublicadorDeEventosEmFila(registrador = console) {
  return {
    async publicar(evento) {
      const mensagem = { id: randomUUID(), origem: ORIGEM, ...evento };
      try {
        const fila = await obterFila();
        await fila.sendMessage(serializar(mensagem));
      } catch (erro) {
        filaPromise = null;
        registrador.error(`Falha ao publicar o evento ${evento.tipo} na fila ${NOME_DA_FILA}`, erro);
      }
    },
  };
}

module.exports = { criarPublicadorDeEventosEmFila, NOME_DA_FILA };
