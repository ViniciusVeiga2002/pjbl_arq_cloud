const test = require('node:test');
const assert = require('node:assert/strict');
const { lerCodigo, listarArquivos, relativo } = require('./suporte/grafoDeDependencias');
const { pastaFonte, arquivosFonte, camadaDe } = require('./suporte/backend');

// ARQUITETURA ORIENTADA A EVENTOS — o servico-pedidos PUBLICA fatos
// (PedidoCadastrado, PedidoAlterado, PedidoExcluido) numa fila; o
// servico-frota CONSOME a fila e reage. Os testes conferem o contrato entre
// produtor e consumidor sem que um importe o código do outro.

const EventosDePedido = require(pastaFonte('servico-pedidos', 'dominio', 'eventos', 'EventosDePedido.js'));
const { NOME_DA_FILA } = require(pastaFonte('servico-pedidos', 'infraestrutura', 'mensageria', 'PublicadorDeEventosEmFila.js'));
const Entrega = require(pastaFonte('servico-frota', 'dominio', 'Entrega.js'));

function filasConsumidasPeloServicoDeFrota() {
  return listarArquivos(pastaFonte('servico-frota', 'features'))
    .map((arquivo) => lerCodigo(arquivo).match(/app\.storageQueue\([\s\S]*?queueName:\s*'([^']+)'/)?.[1])
    .filter(Boolean)
    .sort();
}

test('o servico-frota consome a mesma fila em que o servico-pedidos publica', () => {
  assert.equal(NOME_DA_FILA, 'pedidos-eventos');
  assert.ok(filasConsumidasPeloServicoDeFrota().includes(NOME_DA_FILA));
});

test('o servico-frota consome também a fila de telemetria dos veículos (entrada do OBD2/GPS)', () => {
  assert.deepEqual(filasConsumidasPeloServicoDeFrota(), ['pedidos-eventos', 'telemetria-veiculos']);
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
  const evento = EventosDePedido.pedidoCadastrado({ id: 'PED-1', entregaId: 'ENT-1' });
  assert.deepEqual(Object.keys(evento).sort(), ['dados', 'ocorridoEm', 'tipo', 'versao']);
  assert.equal(typeof evento.versao, 'number');
});

test('todo caso de uso que ALTERA pedidos publica evento; a consulta não publica', () => {
  const pasta = pastaFonte('servico-pedidos', 'features', 'pedidos');
  const escrita = ['cadastrar-pedido/CadastrarPedidoCasoDeUso.js', 'alterar-pedido/AlterarPedidoCasoDeUso.js', 'excluir-pedido/ExcluirPedidoCasoDeUso.js'];
  for (const arquivo of escrita) {
    assert.match(lerCodigo(`${pasta}/${arquivo}`), /publicadorDeEventos\.publicar\(EventosDePedido\./, `${arquivo} não publica evento`);
  }
  assert.doesNotMatch(lerCodigo(`${pasta}/pesquisar-pedidos/PesquisarPedidosCasoDeUso.js`), /publicar\(/);
});

test('o produtor publica por uma porta: só a infraestrutura conhece a fila do Azure', () => {
  const usosDaFila = arquivosFonte('servico-pedidos')
    .filter((arquivo) => /QueueClient|storage-queue/.test(lerCodigo(arquivo)))
    .map((arquivo) => [relativo(arquivo), camadaDe('servico-pedidos', arquivo)]);
  assert.deepEqual(usosDaFila, [
    ['backend/servico-pedidos/src/infraestrutura/mensageria/PublicadorDeEventosEmFila.js', 'infraestrutura'],
  ]);
});
