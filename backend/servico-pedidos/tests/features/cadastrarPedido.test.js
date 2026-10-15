const test = require('node:test');
const assert = require('node:assert/strict');
const CadastrarPedidoCasoDeUso = require('../../src/features/pedidos/cadastrar-pedido/CadastrarPedidoCasoDeUso');
const CadastrarPedidoComando = require('../../src/features/pedidos/cadastrar-pedido/CadastrarPedidoComando');
const ErroDeValidacao = require('../../src/dominio/erros/ErroDeValidacao');
const { criarPublicadorDeEventosFalso } = require('../falsos/publicadorDeEventosFalso');

// Repositório falso (fake), em memória: satisfaz exatamente a
// PortaRepositorioInsercao (método "inserir"), sem precisar de um MongoDB
// de verdade. É a vantagem prática de depender de uma porta (DIP) em vez da
// implementação concreta: o caso de uso é testável isoladamente.
function criarRepositorioFalso() {
  const pedidosInseridos = [];
  return {
    pedidosInseridos,
    async inserir(pedido) {
      pedidosInseridos.push(pedido);
      return pedido;
    },
  };
}

test('CadastrarPedidoCasoDeUso cria o pedido e delega a inserção à porta', async () => {
  const repositorio = criarRepositorioFalso();
  const casoDeUso = new CadastrarPedidoCasoDeUso(repositorio, criarPublicadorDeEventosFalso());

  const comando = new CadastrarPedidoComando({ cliente: 'Transportes Sul', entregaId: 'ENT-501' });
  const pedido = await casoDeUso.executar(comando);

  assert.equal(repositorio.pedidosInseridos.length, 1);
  assert.equal(repositorio.pedidosInseridos[0], pedido);
  assert.match(pedido.id, /^PED-\d{6}$/);
});

test('CadastrarPedidoCasoDeUso propaga ErroDeValidacao sem chamar o repositório', async () => {
  const repositorio = criarRepositorioFalso();
  const casoDeUso = new CadastrarPedidoCasoDeUso(repositorio, criarPublicadorDeEventosFalso());

  const comando = new CadastrarPedidoComando({ cliente: 'Transportes Sul' }); // falta entregaId
  await assert.rejects(() => casoDeUso.executar(comando), ErroDeValidacao);
  assert.equal(repositorio.pedidosInseridos.length, 0);
});

test('CadastrarPedidoCasoDeUso rejeita um adaptador que não implementa a porta', () => {
  assert.throws(() => new CadastrarPedidoCasoDeUso({}, criarPublicadorDeEventosFalso()), TypeError);
});

test('CadastrarPedidoCasoDeUso publica PedidoCadastrado depois de gravar', async () => {
  const repositorio = criarRepositorioFalso();
  const publicador = criarPublicadorDeEventosFalso();
  const casoDeUso = new CadastrarPedidoCasoDeUso(repositorio, publicador);

  const pedido = await casoDeUso.executar(
    new CadastrarPedidoComando({ cliente: 'Transportes Sul', entregaId: 'ENT-501', veiculoPlaca: 'ABC-1D23' })
  );

  assert.equal(publicador.eventosPublicados.length, 1);
  const [evento] = publicador.eventosPublicados;
  assert.equal(evento.tipo, 'PedidoCadastrado');
  assert.equal(evento.dados.id, pedido.id);
  assert.equal(evento.dados.entregaId, 'ENT-501');
  assert.equal(evento.dados.veiculoPlaca, 'ABC-1D23');
});

test('CadastrarPedidoCasoDeUso não publica evento quando a validação falha', async () => {
  const publicador = criarPublicadorDeEventosFalso();
  const casoDeUso = new CadastrarPedidoCasoDeUso(criarRepositorioFalso(), publicador);

  await assert.rejects(() => casoDeUso.executar(new CadastrarPedidoComando({})), ErroDeValidacao);
  assert.equal(publicador.eventosPublicados.length, 0);
});

test('CadastrarPedidoCasoDeUso rejeita um publicador que não implementa a porta', () => {
  assert.throws(() => new CadastrarPedidoCasoDeUso(criarRepositorioFalso(), {}), TypeError);
});
