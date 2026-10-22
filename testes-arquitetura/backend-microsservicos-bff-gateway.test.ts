import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { projectFiles } from 'archunit';
import * as TabelaDeRotas from '../backend/gateway/src/dominio/TabelaDeRotas';
import {
  MICROSSERVICOS,
  PROJETOS_DE_BACKEND,
  TSCONFIG_DO_BACKEND,
  condicao,
  ehAdaptadorDeEntrada,
  importacoesDe,
  lerTexto,
  pastaDoProjeto,
  semComentarios,
  tsconfigDoBackend,
  verificar,
  type ProjetoDeBackend,
} from './suporte/arquitetura';

// MICROSSERVIÇOS + DATABASE PER SERVICE + BFF + API GATEWAY + SERVERLESS.

const arquivos = (projeto: ProjetoDeBackend) => projectFiles(tsconfigDoBackend(projeto));
const todoOBackend = () => projectFiles(TSCONFIG_DO_BACKEND);

function lerPackageJson(projeto: ProjetoDeBackend): { main: string; dependencies?: Record<string, string> } {
  return JSON.parse(fs.readFileSync(path.join(pastaDoProjeto(projeto), 'package.json'), 'utf8'));
}

function nomeDoBancoDe(servico: ProjetoDeBackend): string {
  const codigo = semComentarios(lerTexto('backend', servico, 'src', 'infraestrutura', 'persistencia', 'ConexaoMongoDB.ts'));
  return codigo.match(/MONGODB_DB_PADRAO\s*=\s*'([^']+)'/)![1];
}

// Caminhos (relativos ao tsconfig) dos arquivos que casam com o filtro, vistos pelo ArchUnitTS.
async function caminhosEm(projeto: ProjetoDeBackend, pasta: string): Promise<string[]> {
  const caminhos: string[] = [];
  await arquivos(projeto)
    .inFolder(pasta)
    .should()
    .adhereTo((arquivo) => {
      caminhos.push(arquivo.path);
      return true;
    }, 'inventário')
    .check();
  return caminhos.sort();
}

test('cada projeto de backend é implantável sozinho (package.json e host.json próprios)', () => {
  for (const projeto of PROJETOS_DE_BACKEND) {
    assert.ok(fs.existsSync(path.join(pastaDoProjeto(projeto), 'package.json')), `${projeto} sem package.json`);
    assert.ok(fs.existsSync(path.join(pastaDoProjeto(projeto), 'host.json')), `${projeto} sem host.json`);
  }
});

test('nenhum projeto de backend importa código de outro projeto (sem acoplamento por código)', async () => {
  for (const projeto of PROJETOS_DE_BACKEND) {
    for (const outro of PROJETOS_DE_BACKEND.filter((p) => p !== projeto)) {
      await verificar(todoOBackend().inFolder(`${projeto}/**`).shouldNot().dependOnFiles().inFolder(`${outro}/**`));
    }
  }
});

test('Database per Service: cada microsserviço tem o SEU banco, com nome exclusivo', () => {
  const bancos = MICROSSERVICOS.map(nomeDoBancoDe);
  assert.deepEqual(bancos, ['pjbl_pedidos', 'pjbl_frota']);
  assert.equal(new Set(bancos).size, bancos.length, 'dois serviços compartilhando o mesmo banco');
});

test('Database per Service: nenhum microsserviço menciona o banco de outro', async () => {
  for (const servico of MICROSSERVICOS) {
    for (const outro of MICROSSERVICOS.filter((s) => s !== servico)) {
      const bancoAlheio = nomeDoBancoDe(outro);
      await verificar(
        arquivos(servico)
          .inFolder('src/**')
          .should()
          .adhereTo(
            condicao(tsconfigDoBackend(servico), (codigo) => !semComentarios(codigo).includes(bancoAlheio)),
            `${servico} acessa o banco ${bancoAlheio}`
          )
      );
    }
  }
});

test('BFF e API Gateway não têm banco de dados nem fila (não dependem de mongodb / storage-queue)', () => {
  for (const projeto of ['gateway', 'bff-web'] as const) {
    const dependencias = Object.keys(lerPackageJson(projeto).dependencies ?? {});
    assert.deepEqual(dependencias, ['@azure/functions'], `${projeto} com dependências de persistência`);
  }
});

test('microsserviços não chamam outros serviços por HTTP (colaboram só por eventos)', async () => {
  for (const servico of MICROSSERVICOS) {
    await verificar(
      arquivos(servico)
        .inFolder('src/**')
        .should()
        .adhereTo(
          condicao(
            tsconfigDoBackend(servico),
            (codigo) =>
              !/\bfetch\(|SERVICO_\w+_URL|BFF_\w+_URL/.test(semComentarios(codigo)) &&
              !importacoesDe(codigo).some((i) => /^node:https?$/.test(i.especificador))
          ),
          'microsserviço fazendo chamada HTTP a outro serviço'
        )
    );
  }
});

test('BFF: só ele conhece as URLs dos microsserviços, por meio dos seus clientes HTTP', async () => {
  assert.deepEqual(await caminhosEm('bff-web', 'src/infraestrutura/clientes/**'), [
    'src/infraestrutura/clientes/ClienteServicoDeFrota.ts',
    'src/infraestrutura/clientes/ClienteServicoDePedidos.ts',
    'src/infraestrutura/clientes/chamarServico.ts',
  ]);
  await verificar(
    arquivos('gateway')
      .inFolder('src/**')
      .should()
      .adhereTo(
        condicao(tsconfigDoBackend('gateway'), (codigo) => !/SERVICO_\w+_URL|pjbl-arq-cloud-(pedidos|frota)/.test(semComentarios(codigo))),
        'o gateway conhece um microsserviço'
      )
  );
});

test('API Gateway: a tabela de rotas só encaminha para Backends for Frontends', () => {
  const destinos = TabelaDeRotas.rotas().map((r) => r.destino);
  assert.ok(destinos.length > 0);
  assert.ok(destinos.every((d) => d.startsWith('bff-')), `destinos: ${destinos.join(', ')}`);
});

test('API Gateway é a única porta pública: só ele tem Function HTTP anônima; o resto exige chave', async () => {
  const anonimas: string[] = [];
  for (const projeto of PROJETOS_DE_BACKEND) {
    await verificar(
      arquivos(projeto)
        .inFolder('src/features/**')
        .should()
        .adhereTo(
          condicao(tsconfigDoBackend(projeto), (texto, arquivo) => {
            if (!ehAdaptadorDeEntrada(arquivo)) return true;
            const codigo = semComentarios(texto);
            if (!codigo.includes('app.http(')) return true;
            const nivel = codigo.match(/authLevel:\s*'(\w+)'/)?.[1];
            if (nivel === 'anonymous') anonimas.push(`backend/${projeto}/${arquivo.path}`);
            return nivel !== undefined;
          }),
          'Function HTTP sem authLevel explícito'
        )
    );
  }
  assert.deepEqual(anonimas, ['backend/gateway/src/features/roteamento/encaminhar-requisicao/encaminharRequisicaoFunction.ts']);
});

test('Serverless: todo ponto de entrada é uma Azure Function (HTTP ou Queue Trigger), sem servidor próprio', async () => {
  for (const projeto of PROJETOS_DE_BACKEND) {
    assert.equal(lerPackageJson(projeto).main, 'dist/src/features/**/*Function.js', `${projeto}: main fora do padrão`);

    await verificar(
      arquivos(projeto)
        .inFolder('src/**')
        .should()
        .adhereTo(
          condicao(
            tsconfigDoBackend(projeto),
            (codigo) =>
              !/\.listen\(/.test(semComentarios(codigo)) && !importacoesDe(codigo).some((i) => /^(express|fastify|koa)$/.test(i.especificador))
          ),
          'o serviço sobe um servidor próprio'
        )
    );

    await verificar(
      arquivos(projeto)
        .inFolder('src/features/**')
        .should()
        .adhereTo(
          condicao(
            tsconfigDoBackend(projeto),
            (codigo, arquivo) => !ehAdaptadorDeEntrada(arquivo) || /app\.(http|storageQueue)\(/.test(semComentarios(codigo))
          ),
          'o adaptador de entrada não registra uma Function'
        )
    );
  }
});
