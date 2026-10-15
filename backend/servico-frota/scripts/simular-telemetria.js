// Simulador do dispositivo OBD2/GPS embarcado nos veículos (RF01/RF02).
//
// Enquanto o hardware real não existe, este script faz o papel do
// dispositivo: a cada ciclo publica, na fila "telemetria-veiculos", um
// evento "LeituraDeTelemetriaRecebida" por veículo. O servico-frota consome
// a fila (Queue Trigger registrarTelemetria) e atualiza o banco pjbl_frota.
//
// Uso:
//   npm run simular-telemetria            → 10 ciclos, 1 a cada 3 s
//   npm run simular-telemetria -- 30 1000 → 30 ciclos, 1 a cada 1 s
//
// A connection string vem de EVENTOS_STORAGE (variável de ambiente) ou, se
// ausente, do local.settings.json deste serviço (Azurite local).
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { QueueClient } = require('@azure/storage-queue');

const NOME_DA_FILA = 'telemetria-veiculos';

const FROTA = [
  { placa: 'ABC-1D23', motorista: 'Juliana Ferreira', lat: -23.5505, lng: -46.6333 },
  { placa: 'DEF-4G56', motorista: 'Carlos Souza', lat: -23.5629, lng: -46.6544 },
  { placa: 'GHI-7J89', motorista: 'Marcos Pereira', lat: -23.533, lng: -46.622 },
];

function lerConexao() {
  if (process.env.EVENTOS_STORAGE) return process.env.EVENTOS_STORAGE;
  const arquivo = path.join(__dirname, '..', 'local.settings.json');
  return JSON.parse(fs.readFileSync(arquivo, 'utf8')).Values.EVENTOS_STORAGE;
}

function proximaLeitura(veiculo) {
  // 15% de chance de estar parado; 20% de chance de excesso de velocidade.
  const sorteio = Math.random();
  const velocidade = sorteio < 0.15 ? 0 : sorteio > 0.8 ? 81 + Math.round(Math.random() * 30) : 20 + Math.round(Math.random() * 55);
  const deslocamento = velocidade / 100000;
  veiculo.lat += (Math.random() - 0.5) * deslocamento;
  veiculo.lng += (Math.random() - 0.5) * deslocamento;
  return {
    id: randomUUID(),
    tipo: 'LeituraDeTelemetriaRecebida',
    versao: 1,
    origem: 'simulador-obd2',
    ocorridoEm: new Date().toISOString(),
    dados: {
      placa: veiculo.placa,
      motorista: veiculo.motorista,
      lat: Number(veiculo.lat.toFixed(6)),
      lng: Number(veiculo.lng.toFixed(6)),
      velocidade,
    },
  };
}

async function main() {
  const ciclos = Number(process.argv[2] || 10);
  const intervaloMs = Number(process.argv[3] || 3000);
  const fila = new QueueClient(lerConexao(), NOME_DA_FILA);
  await fila.createIfNotExists();

  for (let ciclo = 1; ciclo <= ciclos; ciclo++) {
    for (const veiculo of FROTA) {
      const evento = proximaLeitura(veiculo);
      await fila.sendMessage(Buffer.from(JSON.stringify(evento)).toString('base64'));
      console.log(`[${ciclo}/${ciclos}] ${evento.dados.placa} ${evento.dados.velocidade} km/h`);
    }
    if (ciclo < ciclos) await new Promise((resolve) => setTimeout(resolve, intervaloMs));
  }
}

main().catch((erro) => {
  console.error('Falha ao simular telemetria:', erro.message);
  process.exitCode = 1;
});
