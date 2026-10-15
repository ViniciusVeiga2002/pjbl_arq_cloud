const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { encontrarViolacoes, lerCodigo, listarArquivos, relativo, estaDentro } = require('./suporte/grafoDeDependencias');
const { PROJETOS_DE_BACKEND, MICROSSERVICOS, pastaDoProjeto, pastaFonte, arquivosFonte, ehAdaptadorDeEntrada } = require('./suporte/backend');

// MICROSSERVIÇOS + DATABASE PER SERVICE + BFF + API GATEWAY + SERVERLESS.

function lerPackageJson(projeto) {
  return JSON.parse(fs.readFileSync(path.join(pastaDoProjeto(projeto), 'package.json'), 'utf8'));
}

function nomeDoBancoDe(servico) {
  const codigo = lerCodigo(pastaFonte(servico, 'infraestrutura', 'persistencia', 'ConexaoMongoDB.js'));
  return codigo.match(/MONGODB_DB_PADRAO\s*=\s*'([^']+)'/)[1];
}

test('cada projeto de backend é implantável sozinho (package.json e host.json próprios)', () => {
  for (const projeto of PROJETOS_DE_BACKEND) {
    assert.ok(fs.existsSync(path.join(pastaDoProjeto(projeto), 'package.json')), `${projeto} sem package.json`);
    assert.ok(fs.existsSync(path.join(pastaDoProjeto(projeto), 'host.json')), `${projeto} sem host.json`);
  }
});

test('nenhum projeto de backend importa código de outro projeto (sem acoplamento por código)', () => {
  const violacoes = [];
  for (const projeto of PROJETOS_DE_BACKEND) {
    const arquivos = listarArquivos(pastaDoProjeto(projeto));
    violacoes.push(
      ...encontrarViolacoes(arquivos, (_, dep) =>
        dep.arquivo && !estaDentro(dep.arquivo, pastaDoProjeto(projeto)) ? `sai do projeto ${projeto}` : null
      )
    );
  }
  assert.deepEqual(violacoes, []);
});

test('Database per Service: cada microsserviço tem o SEU banco, com nome exclusivo', () => {
  const bancos = MICROSSERVICOS.map(nomeDoBancoDe);
  assert.deepEqual(bancos, ['pjbl_pedidos', 'pjbl_frota']);
  assert.equal(new Set(bancos).size, bancos.length, 'dois serviços compartilhando o mesmo banco');
});

test('Database per Service: nenhum microsserviço menciona o banco de outro', () => {
  const violacoes = [];
  for (const servico of MICROSSERVICOS) {
    for (const outro of MICROSSERVICOS.filter((s) => s !== servico)) {
      const bancoAlheio = nomeDoBancoDe(outro);
      for (const arquivo of arquivosFonte(servico)) {
        if (lerCodigo(arquivo).includes(bancoAlheio)) violacoes.push(`${relativo(arquivo)} acessa ${bancoAlheio}`);
      }
    }
  }
  assert.deepEqual(violacoes, []);
});

test('BFF e API Gateway não têm banco de dados nem fila (não dependem de mongodb / storage-queue)', () => {
  for (const projeto of ['gateway', 'bff-web']) {
    const dependencias = Object.keys(lerPackageJson(projeto).dependencies || {});
    assert.deepEqual(dependencias, ['@azure/functions'], `${projeto} com dependências de persistência`);
  }
});

test('microsserviços não chamam outros serviços por HTTP (colaboram só por eventos)', () => {
  const violacoes = [];
  for (const servico of MICROSSERVICOS) {
    for (const arquivo of arquivosFonte(servico)) {
      const codigo = lerCodigo(arquivo);
      if (/\bfetch\(|require\(['"]node:https?['"]\)|SERVICO_\w+_URL|BFF_\w+_URL/.test(codigo)) {
        violacoes.push(relativo(arquivo));
      }
    }
  }
  assert.deepEqual(violacoes, []);
});

test('BFF: só ele conhece as URLs dos microsserviços, por meio dos seus clientes HTTP', () => {
  const clientes = listarArquivos(pastaFonte('bff-web', 'infraestrutura', 'clientes')).map(relativo);
  assert.deepEqual(clientes, [
    'backend/bff-web/src/infraestrutura/clientes/ClienteServicoDeFrota.js',
    'backend/bff-web/src/infraestrutura/clientes/ClienteServicoDePedidos.js',
    'backend/bff-web/src/infraestrutura/clientes/chamarServico.js',
  ]);
  for (const arquivo of arquivosFonte('gateway')) {
    assert.doesNotMatch(lerCodigo(arquivo), /SERVICO_\w+_URL|pjbl-arq-cloud-(pedidos|frota)/, `${relativo(arquivo)} conhece um microsserviço`);
  }
});

test('API Gateway: a tabela de rotas só encaminha para Backends for Frontends', () => {
  const TabelaDeRotas = require(pastaFonte('gateway', 'dominio', 'TabelaDeRotas.js'));
  const destinos = TabelaDeRotas.rotas().map((r) => r.destino);
  assert.ok(destinos.length > 0);
  assert.ok(destinos.every((d) => d.startsWith('bff-')), `destinos: ${destinos.join(', ')}`);
});

test('API Gateway é a única porta pública: só ele tem Function HTTP anônima; o resto exige chave', () => {
  const anonimas = [];
  for (const projeto of PROJETOS_DE_BACKEND) {
    for (const arquivo of arquivosFonte(projeto).filter(ehAdaptadorDeEntrada)) {
      const codigo = lerCodigo(arquivo);
      if (!codigo.includes('app.http(')) continue;
      const nivel = codigo.match(/authLevel:\s*'(\w+)'/)?.[1];
      assert.ok(nivel, `${relativo(arquivo)} sem authLevel explícito`);
      if (nivel === 'anonymous') anonimas.push(relativo(arquivo));
    }
  }
  assert.deepEqual(anonimas, ['backend/gateway/src/features/roteamento/encaminhar-requisicao/encaminharRequisicaoFunction.js']);
});

test('Serverless: todo ponto de entrada é uma Azure Function (HTTP ou Queue Trigger), sem servidor próprio', () => {
  for (const projeto of PROJETOS_DE_BACKEND) {
    assert.equal(lerPackageJson(projeto).main, 'src/features/**/*Function.js', `${projeto}: main fora do padrão`);
    for (const arquivo of arquivosFonte(projeto)) {
      assert.doesNotMatch(lerCodigo(arquivo), /\.listen\(|require\(['"](express|fastify|koa)['"]\)/, `${relativo(arquivo)} sobe servidor próprio`);
    }
    const funcoes = arquivosFonte(projeto).filter(ehAdaptadorDeEntrada);
    assert.ok(funcoes.length > 0);
    for (const arquivo of funcoes) {
      assert.match(lerCodigo(arquivo), /app\.(http|storageQueue)\(/, `${relativo(arquivo)} não registra uma Function`);
    }
  }
});
