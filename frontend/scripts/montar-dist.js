// Monta o pacote publicado no Azure Static Web Apps a partir dos builds
// INDEPENDENTES de cada microfrontend:
//
//   dist/                 ← shell/dist        (host: layout, abas, carregamento)
//   dist/mfe-pedidos/     ← mfe-pedidos/dist  (remoto: tela de pedidos)
//   dist/mfe-frota/       ← mfe-frota/dist    (remoto: painel da frota)
//
// Cada remoto é compilado com "base" = /mfe-<nome>/ e expõe o seu
// remoteEntry.js; o shell só descobre as telas em tempo de execução
// (Module Federation), por isso nenhum deles importa o código do outro.
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
const destino = path.join(raiz, 'dist');

const PARTES = [
  { origem: 'shell/dist', alvo: '.' },
  { origem: 'mfe-pedidos/dist', alvo: 'mfe-pedidos' },
  { origem: 'mfe-frota/dist', alvo: 'mfe-frota' },
];

fs.rmSync(destino, { recursive: true, force: true });
for (const { origem, alvo } of PARTES) {
  const caminhoDeOrigem = path.join(raiz, origem);
  if (!fs.existsSync(caminhoDeOrigem)) {
    throw new Error(`Build ausente: ${origem}. Rode "npm run build" antes.`);
  }
  fs.cpSync(caminhoDeOrigem, path.join(destino, alvo), { recursive: true });
  console.log(`✔ ${origem} → dist/${alvo === '.' ? '' : alvo}`);
}
