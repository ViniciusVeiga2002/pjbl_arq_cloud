const test = require('node:test');
const assert = require('node:assert/strict');
const AtualizarProjecaoDeEntregaCasoDeUso = require('../../src/features/entregas/atualizar-projecao-de-entrega/AtualizarProjecaoDeEntregaCasoDeUso');
const Entrega = require('../../src/dominio/Entrega');
const ErroDeValidacao = require('../../src/dominio/erros/ErroDeValidacao');
const ErroDeConcorrencia = require('../../src/dominio/erros/ErroDeConcorrencia');
const { eventoDePedido } = require('../eventos');

// Repositório falso em memória que satisfaz a PortaRepositorioDeProjecao,
// inclusive o controle de concorrência otimista do adaptador MongoDB: só
// grava se a versão lida ainda for a do "banco". Guarda cópias (como um
// banco faria) e cede a vez ao event loop a cada operação, para que
// execuções paralelas realmente se intercalem.
const ceder = () => new Promise((resolve) => setImmediate(resolve));

function criarRepositorioFalso() {
  const entregas = new Map();
  const salvas = [];
  return {
    entregas,
    salvas,
    async obterPorId(id) {
      await ceder();
      return entregas.has(id) ? new Entrega(entregas.get(id)) : null;
    },
    async buscarPorPedido(pedidoId) {
      await ceder();
      return [...entregas.values()].filter((e) => e.pedidos.some((p) => p.id === pedidoId)).map((e) => new Entrega(e));
    },
    async salvar(entrega) {
      await ceder();
      const versaoNoBanco = entregas.get(entrega.id)?.versao ?? 0;
      if (versaoNoBanco !== entrega.versao) throw new ErroDeConcorrencia(entrega.id);
      salvas.push(entrega.id);
      entrega.versao += 1;
      entregas.set(entrega.id, new Entrega(entrega));
    },
  };
}

test('AtualizarProjecaoDeEntregaCasoDeUso cria a entrega a partir de PedidoCadastrado', async () => {
  const repositorio = criarRepositorioFalso();
  const casoDeUso = new AtualizarProjecaoDeEntregaCasoDeUso(repositorio);

  const { aplicado, entrega } = await casoDeUso.executar(
    eventoDePedido('PedidoCadastrado', '2026-10-14T10:00:00.000Z', { id: 'PED-1', entregaId: 'ENT-501', status: 'Em rota' })
  );

  assert.equal(aplicado, true);
  assert.equal(entrega.id, 'ENT-501');
  assert.equal(entrega.situacao, 'Em rota');
  assert.ok(repositorio.entregas.has('ENT-501'));
});

test('AtualizarProjecaoDeEntregaCasoDeUso move o pedido quando a entrega muda', async () => {
  const repositorio = criarRepositorioFalso();
  const casoDeUso = new AtualizarProjecaoDeEntregaCasoDeUso(repositorio);

  await casoDeUso.executar(eventoDePedido('PedidoCadastrado', '2026-10-14T10:00:00.000Z', { id: 'PED-1', entregaId: 'ENT-501' }));
  await casoDeUso.executar(eventoDePedido('PedidoAlterado', '2026-10-14T11:00:00.000Z', { id: 'PED-1', entregaId: 'ENT-502' }));

  assert.equal((await repositorio.obterPorId('ENT-501')).resumo().totalDePedidos, 0);
  assert.equal((await repositorio.obterPorId('ENT-502')).resumo().totalDePedidos, 1);
});

test('AtualizarProjecaoDeEntregaCasoDeUso não grava quando o evento é mais antigo que o aplicado', async () => {
  const repositorio = criarRepositorioFalso();
  const casoDeUso = new AtualizarProjecaoDeEntregaCasoDeUso(repositorio);
  await casoDeUso.executar(eventoDePedido('PedidoAlterado', '2026-10-14T11:00:00.000Z', { id: 'PED-1', entregaId: 'ENT-501', status: 'Entregue' }));
  repositorio.salvas.length = 0;

  const { aplicado } = await casoDeUso.executar(
    eventoDePedido('PedidoAlterado', '2026-10-14T10:00:00.000Z', { id: 'PED-1', entregaId: 'ENT-501', status: 'Em rota' })
  );

  assert.equal(aplicado, false);
  assert.deepEqual(repositorio.salvas, []);
});

test('AtualizarProjecaoDeEntregaCasoDeUso rejeita evento inválido sem gravar nada', async () => {
  const repositorio = criarRepositorioFalso();
  const casoDeUso = new AtualizarProjecaoDeEntregaCasoDeUso(repositorio);

  await assert.rejects(() => casoDeUso.executar({ tipo: 'Desconhecido', dados: {} }), ErroDeValidacao);
  assert.deepEqual(repositorio.salvas, []);
});

test('AtualizarProjecaoDeEntregaCasoDeUso rejeita um adaptador incompleto', () => {
  assert.throws(() => new AtualizarProjecaoDeEntregaCasoDeUso({ obterPorId() {}, salvar() {} }), TypeError);
});

test('AtualizarProjecaoDeEntregaCasoDeUso não perde atualização com eventos da mesma entrega em paralelo', async () => {
  const repositorio = criarRepositorioFalso();
  const casoDeUso = new AtualizarProjecaoDeEntregaCasoDeUso(repositorio);
  await casoDeUso.executar(eventoDePedido('PedidoCadastrado', '2026-10-14T10:00:00.000Z', { id: 'PED-1', entregaId: 'ENT-501', status: 'Em rota' }));
  await casoDeUso.executar(eventoDePedido('PedidoCadastrado', '2026-10-14T10:00:00.000Z', { id: 'PED-2', entregaId: 'ENT-501', status: 'Atrasado' }));

  // Como o BFF faz ao concluir a entrega: dois PedidoAlterado ao mesmo tempo.
  await Promise.all([
    casoDeUso.executar(eventoDePedido('PedidoAlterado', '2026-10-14T11:00:00.000Z', { id: 'PED-1', entregaId: 'ENT-501', status: 'Entregue' })),
    casoDeUso.executar(eventoDePedido('PedidoAlterado', '2026-10-14T11:00:00.000Z', { id: 'PED-2', entregaId: 'ENT-501', status: 'Entregue' })),
  ]);

  const resumo = (await repositorio.obterPorId('ENT-501')).resumo();
  assert.equal(resumo.pedidosEntregues, 2);
  assert.equal(resumo.situacao, 'Concluída');
});

test('AtualizarProjecaoDeEntregaCasoDeUso desiste após esgotar as tentativas e deixa a fila reprocessar', async () => {
  const repositorio = criarRepositorioFalso();
  repositorio.salvar = async (entrega) => {
    throw new ErroDeConcorrencia(entrega.id);
  };
  const casoDeUso = new AtualizarProjecaoDeEntregaCasoDeUso(repositorio);

  await assert.rejects(
    () => casoDeUso.executar(eventoDePedido('PedidoCadastrado', '2026-10-14T10:00:00.000Z', { id: 'PED-1', entregaId: 'ENT-501' })),
    ErroDeConcorrencia
  );
});
