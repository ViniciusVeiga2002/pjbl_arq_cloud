import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { projectFiles } from 'archunit';
import {
  TSCONFIG_DO_FRONTEND,
  caminhoDoProjeto,
  condicao,
  importacoesDe,
  lerTexto,
  semComentarios,
  verificar,
} from './suporte/arquitetura';

// MICROFRONTEND — shell (host) + remotos independentes, integrados em tempo
// de execução por Module Federation. As regras de dependência usam o
// ArchUnitTS sobre frontend/tsconfig.json (padrões relativos a frontend/).

const SHELL = 'shell';
const REMOTOS = { 'mfe-pedidos': 'mfePedidos', 'mfe-frota': 'mfeFrota' } as const;
const MFES = Object.keys(REMOTOS) as (keyof typeof REMOTOS)[];
const APLICACOES = [SHELL, ...MFES];

const frontend = () => projectFiles(TSCONFIG_DO_FRONTEND);
const lerDoApp = (app: string, ...partes: string[]): string => lerTexto('frontend', app, ...partes);
const configDe = (app: string): string => lerDoApp(app, 'vite.config.ts');

// Arquivos .css dentro de src/ do app (o ArchUnitTS só enxerga TypeScript).
function listarCss(pasta: string): string[] {
  return fs.readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = path.join(pasta, entrada.name);
    if (entrada.isDirectory()) return listarCss(caminho);
    return caminho.endsWith('.css') ? [caminho] : [];
  });
}

test('shell e cada microfrontend são projetos separados, com build próprio', () => {
  for (const app of APLICACOES) {
    const pacote = JSON.parse(lerDoApp(app, 'package.json'));
    assert.equal(pacote.name, app);
    assert.ok(pacote.scripts.build, `${app} sem script de build`);
    assert.match(configDe(app), /federation\(/, `${app} não usa Module Federation`);
  }
});

test('nenhuma aplicação de frontend importa código-fonte de outra', async () => {
  for (const app of APLICACOES) {
    for (const outra of APLICACOES.filter((a) => a !== app)) {
      await verificar(frontend().inFolder(`${app}/**`).shouldNot().dependOnFiles().inFolder(`${outra}/**`));
    }
  }
});

test('o shell só alcança os remotos pelos módulos federados (mfePedidos/..., mfeFrota/...)', async () => {
  const importacoesFederadas: string[] = [];
  await verificar(
    frontend()
      .inFolder(`${SHELL}/src/**`)
      .should()
      .adhereTo(
        condicao(TSCONFIG_DO_FRONTEND, (codigo, arquivo) => {
          if (arquivo.name.endsWith('.d')) return true; // declarações de tipos dos módulos federados
          for (const { especificador } of importacoesDe(codigo)) {
            if ((Object.values(REMOTOS) as string[]).includes(especificador.split('/')[0])) {
              importacoesFederadas.push(especificador);
            }
          }
          return true;
        }),
        'inventário das importações dos remotos'
      )
  );
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

test('o módulo exposto por cada remoto existe e é um componente exportado por padrão', async () => {
  for (const [app, tela] of [['mfe-pedidos', 'TelaPedidos'], ['mfe-frota', 'TelaFrota']]) {
    assert.match(configDe(app), new RegExp(`'\\./${tela}':\\s*'\\./src/${tela}\\.tsx'`), `${app} expõe outro arquivo`);
    await verificar(
      frontend()
        .inFolder(`${app}/src`)
        .should()
        .adhereTo(
          condicao(TSCONFIG_DO_FRONTEND, (codigo, arquivo) => arquivo.name !== tela || /export default function/.test(codigo)),
          `${tela} deve exportar o componente por padrão`
        )
    );
  }
});

test('React é compartilhado como singleton por todas as aplicações (uma única instância na página)', () => {
  for (const app of APLICACOES) {
    assert.match(configDe(app), /react:\s*\{\s*singleton:\s*true/, `${app}: react não é singleton`);
    assert.match(configDe(app), /'react-dom':\s*\{\s*singleton:\s*true/, `${app}: react-dom não é singleton`);
  }
});

test('nos microfrontends, só a camada services/ faz chamadas HTTP', async () => {
  for (const app of MFES) {
    await verificar(
      frontend()
        .inPath(new RegExp(`^${app}/src/(?!services/)`))
        .should()
        .adhereTo(
          condicao(TSCONFIG_DO_FRONTEND, (codigo) => !/\bfetch\(/.test(semComentarios(codigo))),
          'chamada HTTP (fetch) fora de services/'
        )
    );
  }
});

test('os microfrontends falam só com o API Gateway (nunca com BFF ou microsserviço direto)', async () => {
  for (const app of MFES) {
    await verificar(
      frontend()
        .inFolder(`${app}/src/**`)
        .should()
        .adhereTo(
          condicao(TSCONFIG_DO_FRONTEND, (codigo) => !/localhost:707[1-3]|pjbl-arq-cloud-(bff|pedidos|frota)/.test(semComentarios(codigo))),
          'a tela fura o gateway'
        )
    );
    for (const ambiente of ['.env.development', '.env.production']) {
      assert.doesNotMatch(lerDoApp(app, ambiente), /localhost:707[1-3]|pjbl-arq-cloud-(bff|pedidos|frota)/, `${app}/${ambiente} fura o gateway`);
    }
    assert.match(lerDoApp(app, '.env.production'), /VITE_GATEWAY_URL=https:\/\/pjbl-arq-cloud-gateway\./);
    assert.match(lerDoApp(app, '.env.development'), /VITE_GATEWAY_URL=http:\/\/localhost:7070\//);
  }
});

test('cada microfrontend tem estilos com escopo na própria classe raiz', () => {
  for (const [app, classe] of [['mfe-pedidos', '.mfe-pedidos'], ['mfe-frota', '.mfe-frota']]) {
    const css = listarCss(caminhoDoProjeto('frontend', app, 'src'));
    assert.ok(css.length > 0);
    for (const arquivo of css) {
      const semComentariosCss = fs.readFileSync(arquivo, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').trim();
      assert.ok(semComentariosCss.startsWith(`${classe} {`), `${path.basename(arquivo)} tem regras fora de ${classe}`);
    }
  }
});

test('o build publicado coloca cada remoto na sua pasta (dist/mfe-pedidos, dist/mfe-frota)', () => {
  const script = lerTexto('frontend', 'scripts', 'montar-dist.js');
  for (const app of MFES) {
    assert.match(script, new RegExp(`origem: '${app}/dist', alvo: '${app}'`));
  }
});
