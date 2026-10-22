import test from 'node:test';
import assert from 'node:assert/strict';
import { projectFiles } from 'archunit';
import EventosDePedido from '../backend/servico-pedidos/src/dominio/eventos/EventosDePedido';
import { NOME_DA_FILA } from '../backend/servico-pedidos/src/infraestrutura/mensageria/PublicadorDeEventosEmFila';
import Entrega from '../backend/servico-frota/src/dominio/Entrega';
import {
  condicao,
  importacoesDe,
  lerTexto,
  nomeDoPacote,
  pastaDaCamada,
  semComentarios,
  tsconfigDoBackend,
  verificar,
  type ProjetoDeBackend,
} from './suporte/arquitetura';

// ARQUITETURA ORIENTADA A EVENTOS — o servico-pedidos PUBLICA fatos
// (PedidoCadastrado, PedidoAlterado, PedidoExcluido) numa fila; o
// servico-frota CONSOME a fila e reage. Os testes conferem o contrato entre
// produtor e consumidor sem que um importe o código do outro.

const arquivos = (projeto: ProjetoDeBackend) => projectFiles(tsconfigDoBackend(projeto));

// Nomes das filas que o servico-frota consome (app.storageQueue com queueName).
async function filasConsumidasPeloServicoDeFrota(): Promise<string[]> {
  const filas: string[] = [];
  await arquivos('servico-frota')
    .inFolder(pastaDaCamada('features'))
    .should()
    .adhereTo(
      condicao(tsconfigDoBackend('servico-frota'), (codigo) => {
        const fila = semComentarios(codigo).match(/app\.storageQueue\([\s\S]*?queueName:\s*'([^']+)'/)?.[1];
        if (fila) filas.push(fila);
        return true;
      }),
      'inventário das filas consumidas'
    )
    .check();
  return filas.sort();
}

test('o servico-frota consome a mesma fila em que o servico-pedidos publica', async () => {
  assert.equal(NOME_DA_FILA, 'pedidos-eventos');
  assert.ok((await filasConsumidasPeloServicoDeFrota()).includes(NOME_DA_FILA));
});

test('o servico-frota consome também a fila de telemetria dos veículos (entrada do OBD2/GPS)', async () => {
  assert.deepEqual(await filasConsumidasPeloServicoDeFrota(), ['pedidos-eventos', 'telemetria-veiculos']);
});

test('todo tipo de evento publicado pelo servico-pedidos é aceito pelo consumidor', () => {
  const pedido = { id: 'PED-1', entregaId: 'ENT-1', veiculoPlaca: 'ABC-1D23', status: 'Em rota', previsaoEntrega: '2026-10-20T18:00:00.000Z' };
  const fabricas = [EventosDePedido.pedidoCadastrado, EventosDePedido.pedidoAlterado, EventosDePedido.pedidoExcluido];
  assert.deepEqual(
    fabricas.map((f) => f(pedido).tipo).sort(),
    Object.values(EventosDePedido.tipos).sort(),
    'existe tipo de evento sem fábrica'
  );
  for (const fabrica of fabricas) {
    assert.doesNotThrow(() => Entrega.validarEvento(fabrica(pedido)), `consumidor rejeita ${fabrica(pedido).tipo}`);
  }
});

test('os eventos têm envelope versionado (tipo, versao, ocorridoEm, dados)', () => {
  const evento = EventosDePedido.pedidoCadastrado({ id: 'PED-1', entregaId: 'ENT-1', veiculoPlaca: '', status: 'Em rota', previsaoEntrega: '' });
  assert.deepEqual(Object.keys(evento).sort(), ['dados', 'ocorridoEm', 'tipo', 'versao']);
  assert.equal(typeof evento.versao, 'number');
});

test('todo caso de uso que ALTERA pedidos publica evento; a consulta não publica', async () => {
  const escrita = ['cadastrar-pedido/CadastrarPedidoCasoDeUso', 'alterar-pedido/AlterarPedidoCasoDeUso', 'excluir-pedido/ExcluirPedidoCasoDeUso'];
  const pasta = ['backend', 'servico-pedidos', 'src', 'features', 'pedidos'];
  for (const arquivo of escrita) {
    assert.match(
      semComentarios(lerTexto(...pasta, `${arquivo}.ts`)),
      /publicadorDeEventos\.publicar\(EventosDePedido\./,
      `${arquivo} não publica evento`
    );
  }
  assert.doesNotMatch(semComentarios(lerTexto(...pasta, 'pesquisar-pedidos', 'PesquisarPedidosCasoDeUso.ts')), /publicar\(/);
});

test('o produtor publica por uma porta: só a infraestrutura conhece a fila do Azure', async () => {
  // Fora da infraestrutura, ninguém importa @azure/storage-queue nem cita QueueClient...
  for (const camada of ['dominio', 'aplicacao', 'features', 'composicao'] as const) {
    await verificar(
      arquivos('servico-pedidos')
        .inFolder(pastaDaCamada(camada))
        .should()
        .adhereTo(
          condicao(
            tsconfigDoBackend('servico-pedidos'),
            (codigo) =>
              !importacoesDe(codigo).some((i) => nomeDoPacote(i.especificador) === '@azure/storage-queue') &&
              !/QueueClient/.test(semComentarios(codigo))
          ),
          `a camada ${camada} conhece a fila do Azure`
        )
    );
  }

  // ...e, dentro dela, só o publicador de eventos.
  const usosDaFila: string[] = [];
  await arquivos('servico-pedidos')
    .inFolder(pastaDaCamada('infraestrutura'))
    .should()
    .adhereTo(
      condicao(tsconfigDoBackend('servico-pedidos'), (codigo, arquivo) => {
        if (/QueueClient|storage-queue/.test(semComentarios(codigo))) usosDaFila.push(arquivo.path);
        return true;
      }),
      'inventário dos usos da fila'
    )
    .check();
  assert.deepEqual(usosDaFila, ['src/infraestrutura/mensageria/PublicadorDeEventosEmFila.ts']);
});
