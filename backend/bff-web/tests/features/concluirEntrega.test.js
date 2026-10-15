const test = require('node:test');
const assert = require('node:assert/strict');
const ConcluirEntregaCasoDeUso = require('../../src/features/pedidos/concluir-entrega/ConcluirEntregaCasoDeUso');

function criarServicoDePedidosFalso(pedidos) {
  const alteracoes = [];
  return {
    alteracoes,
    filtrosRecebidos: [],
    async pesquisar(filtros) {
      this.filtrosRecebidos.push(filtros);
      return pedidos;
    },
    async alterar(id, dados) {
      alteracoes.push({ id, dados });
      return { id, ...dados };
    },
  };
}

test('ConcluirEntregaCasoDeUso marca como Entregue só os pedidos pendentes da entrega', async () => {
  const servico = criarServicoDePedidosFalso([
    { id: 'PED-1', status: 'Em rota' },
    { id: 'PED-2', status: 'Entregue' },
    { id: 'PED-3', status: 'Atrasado' },
  ]);

  const resultado = await new ConcluirEntregaCasoDeUso(servico).executar('ENT-501');

  assert.deepEqual(servico.filtrosRecebidos, [{ entregaId: 'ENT-501' }]);
  assert.deepEqual(servico.alteracoes.map((a) => a.id), ['PED-1', 'PED-3']);
  assert.ok(servico.alteracoes.every((a) => a.dados.status === 'Entregue'));
  assert.deepEqual(resultado, { entregaId: 'ENT-501', pedidosConcluidos: ['PED-1', 'PED-3'] });
});

test('ConcluirEntregaCasoDeUso exige pesquisar e alterar na porta', () => {
  assert.throws(() => new ConcluirEntregaCasoDeUso({ pesquisar() {} }), TypeError);
});
