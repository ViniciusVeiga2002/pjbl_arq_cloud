const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { caminhoDoProjeto, listarArquivos, encontrarViolacoes, lerCodigo, relativo, estaDentro } = require('./suporte/grafoDeDependencias');

// MICROFRONTEND — shell (host) + remotos independentes, integrados em tempo
// de execução por Module Federation.

const SHELL = 'shell';
const REMOTOS = Object.freeze({ 'mfe-pedidos': 'mfePedidos', 'mfe-frota': 'mfeFrota' });
const APLICACOES = [SHELL, ...Object.keys(REMOTOS)];

const pastaDe = (app, ...partes) => caminhoDoProjeto('frontend', app, ...partes);
const fontesDe = (app) => listarArquivos(pastaDe(app, 'src'));
const configDe = (app) => fs.readFileSync(pastaDe(app, 'vite.config.js'), 'utf8');

test('shell e cada microfrontend são projetos separados, com build próprio', () => {
  for (const app of APLICACOES) {
    const pacote = JSON.parse(fs.readFileSync(pastaDe(app, 'package.json'), 'utf8'));
    assert.equal(pacote.name, app);
    assert.ok(pacote.scripts.build, `${app} sem script de build`);
    assert.match(configDe(app), /federation\(/, `${app} não usa Module Federation`);
  }
});

test('nenhuma aplicação de frontend importa código-fonte de outra', () => {
  const violacoes = [];
  for (const app of APLICACOES) {
    violacoes.push(
      ...encontrarViolacoes(fontesDe(app), (_, dep) =>
        dep.arquivo && !estaDentro(dep.arquivo, pastaDe(app)) ? `sai de frontend/${app}` : null
      )
    );
  }
  assert.deepEqual(violacoes, []);
});

test('o shell só alcança os remotos pelos módulos federados (mfePedidos/..., mfeFrota/...)', () => {
  const importacoesFederadas = [];
  encontrarViolacoes(fontesDe(SHELL), (_, dep) => {
    if (Object.values(REMOTOS).includes(dep.pacote)) importacoesFederadas.push(dep.especificador);
    return null;
  });
  assert.deepEqual(importacoesFederadas.sort(), ['mfeFrota/TelaFrota', 'mfePedidos/TelaPedidos']);
});

test('cada remoto declarado no shell existe e expõe o módulo que o shell usa', () => {
  const configDoShell = configDe(SHELL);
  for (const [app, nome] of Object.entries(REMOTOS)) {
    const configDoRemoto = configDe(app);
    assert.match(configDoRemoto, new RegExp(`name:\\s*'${nome}'`), `${app} não se chama ${nome}`);
    assert.match(configDoRemoto, /filename:\s*'remoteEntry\.js'/);
    assert.match(configDoRemoto, new RegExp(`base:\\s*'/${app}/'`), `${app} com base diferente da pasta publicada`);
    assert.match(configDoShell, new RegExp(`entry:\\s*'/${app}/remoteEntry\\.js'`), `shell não registra ${app}`);
  }
  assert.match(configDe('mfe-pedidos'), /'\.\/TelaPedidos':/);
  assert.match(configDe('mfe-frota'), /'\.\/TelaFrota':/);
});

test('React é compartilhado como singleton por todas as aplicações (uma única instância na página)', () => {
  for (const app of APLICACOES) {
    assert.match(configDe(app), /react:\s*\{\s*singleton:\s*true/, `${app}: react não é singleton`);
    assert.match(configDe(app), /'react-dom':\s*\{\s*singleton:\s*true/, `${app}: react-dom não é singleton`);
  }
});

test('nos microfrontends, só a camada services/ faz chamadas HTTP', () => {
  const violacoes = [];
  for (const app of Object.keys(REMOTOS)) {
    for (const arquivo of fontesDe(app)) {
      if (!estaDentro(arquivo, pastaDe(app, 'src', 'services')) && /\bfetch\(/.test(lerCodigo(arquivo))) {
        violacoes.push(relativo(arquivo));
      }
    }
  }
  assert.deepEqual(violacoes, []);
});

test('os microfrontends falam só com o API Gateway (nunca com BFF ou microsserviço direto)', () => {
  for (const app of Object.keys(REMOTOS)) {
    for (const arquivo of [...fontesDe(app), pastaDe(app, '.env.development'), pastaDe(app, '.env.production')]) {
      const conteudo = fs.readFileSync(arquivo, 'utf8');
      assert.doesNotMatch(conteudo, /localhost:707[1-3]|pjbl-arq-cloud-(bff|pedidos|frota)/, `${relativo(arquivo)} fura o gateway`);
    }
    assert.match(fs.readFileSync(pastaDe(app, '.env.production'), 'utf8'), /VITE_GATEWAY_URL=https:\/\/pjbl-arq-cloud-gateway\./);
    assert.match(fs.readFileSync(pastaDe(app, '.env.development'), 'utf8'), /VITE_GATEWAY_URL=http:\/\/localhost:7070\//);
  }
});

test('cada microfrontend tem estilos com escopo na própria classe raiz', () => {
  for (const [app, classe] of [['mfe-pedidos', '.mfe-pedidos'], ['mfe-frota', '.mfe-frota']]) {
    const css = listarArquivos(pastaDe(app, 'src'), ['.css']);
    assert.ok(css.length > 0);
    for (const arquivo of css) {
      const semComentarios = fs.readFileSync(arquivo, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').trim();
      assert.ok(semComentarios.startsWith(`${classe} {`), `${relativo(arquivo)} tem regras fora de ${classe}`);
    }
  }
});

test('o build publicado coloca cada remoto na sua pasta (dist/mfe-pedidos, dist/mfe-frota)', () => {
  const script = fs.readFileSync(caminhoDoProjeto('frontend', 'scripts', 'montar-dist.js'), 'utf8');
  for (const app of Object.keys(REMOTOS)) {
    assert.match(script, new RegExp(`origem: '${app}/dist', alvo: '${app}'`));
  }
});
