const test = require('node:test');
const assert = require('node:assert/strict');
const PesquisarPedidosCasoDeUso = require('../../src/features/pedidos/pesquisar-pedidos/PesquisarPedidosCasoDeUso');

// Serviços falsos: satisfazem as portas do BFF sem nenhuma chamada HTTP.
const servicoDePedidos = {
  async pesquisar() {
    return [
      { id: 'PED-1', veiculoPlaca: 'ABC-1D23', status: 'Em rota' },
      { id: 'PED-2', veiculoPlaca: 'ZZZ-0000', status: 'Em rota' },
    ];
  },
};
const registradorSilencioso = { warn() {} };

test('PesquisarPedidosCasoDeUso junta cada pedido com a situação do seu veículo', async () => {
  const servicoDeFrota = {
    async listarVeiculos() {
      return [{ placa: 'ABC-1D23', velocidade: 95, status: 'alerta-velocidade', motorista: 'Juliana Ferreira' }];
    },
  };
  const pedidos = await new PesquisarPedidosCasoDeUso(servicoDePedidos, servicoDeFrota, registradorSilencioso).executar({});

  assert.deepEqual(pedidos[0].veiculo, { velocidade: 95, status: 'alerta-velocidade', motorista: 'Juliana Ferreira' });
  assert.equal(pedidos[1].veiculo, null);
});

test('PesquisarPedidosCasoDeUso devolve os pedidos mesmo com o servico-frota fora do ar', async () => {
  const servicoDeFrota = {
    async listarVeiculos() {
      throw new Error('ECONNREFUSED');
    },
  };
  const pedidos = await new PesquisarPedidosCasoDeUso(servicoDePedidos, servicoDeFrota, registradorSilencioso).executar({});

  assert.equal(pedidos.length, 2);
  assert.ok(pedidos.every((p) => p.veiculo === null));
});

test('PesquisarPedidosCasoDeUso propaga a falha do servico-pedidos (dado essencial da tela)', async () => {
  const servicoFalho = {
    async pesquisar() {
      throw new Error('servico-pedidos indisponível');
    },
  };
  const servicoDeFrota = { listarVeiculos: async () => [] };

  await assert.rejects(() => new PesquisarPedidosCasoDeUso(servicoFalho, servicoDeFrota).executar({}), /indisponível/);
});

test('PesquisarPedidosCasoDeUso rejeita adaptadores que não implementam as portas', () => {
  assert.throws(() => new PesquisarPedidosCasoDeUso({}, { listarVeiculos() {} }), TypeError);
  assert.throws(() => new PesquisarPedidosCasoDeUso(servicoDePedidos, {}), TypeError);
});
