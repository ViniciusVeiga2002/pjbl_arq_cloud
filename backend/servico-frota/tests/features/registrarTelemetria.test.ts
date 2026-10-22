import test from 'node:test';
import assert from 'node:assert/strict';
import RegistrarTelemetriaCasoDeUso from '../../src/features/veiculos/registrar-telemetria/RegistrarTelemetriaCasoDeUso';
import RegistrarTelemetriaComando from '../../src/features/veiculos/registrar-telemetria/RegistrarTelemetriaComando';
import Veiculo from '../../src/dominio/Veiculo';
import { PortaRepositorioDeLeituras } from '../../src/features/veiculos/registrar-telemetria/PortaRepositorioDeLeituras';
import ErroDeValidacao from '../../src/dominio/erros/ErroDeValidacao';

// Repositório falso: satisfaz a PortaRepositorioDeLeituras sem MongoDB.
function criarRepositorioFalso() {
  const leiturasSalvas: Veiculo[] = [];
  return {
    leiturasSalvas,
    async salvarUltimaLeitura(veiculo: Veiculo) {
      leiturasSalvas.push(veiculo);
      return veiculo;
    },
  };
}

const evento = {
  tipo: 'LeituraDeTelemetriaRecebida',
  versao: 1,
  ocorridoEm: '2026-10-14T10:00:00.000Z',
  dados: { placa: 'GHI-7J89', motorista: 'Marcos Pereira', lat: -23.53, lng: -46.62, velocidade: 98 },
};

test('RegistrarTelemetriaCasoDeUso grava o veículo com o status calculado pelo domínio', async () => {
  const repositorio = criarRepositorioFalso();
  const veiculo = await new RegistrarTelemetriaCasoDeUso(repositorio).executar(
    RegistrarTelemetriaComando.aPartirDoEvento(evento)
  );

  assert.equal(repositorio.leiturasSalvas.length, 1);
  assert.equal(veiculo.status, 'alerta-velocidade');
});

test('RegistrarTelemetriaComando usa o ocorridoEm do evento como registradoEm', () => {
  assert.equal(RegistrarTelemetriaComando.aPartirDoEvento(evento).registradoEm, '2026-10-14T10:00:00.000Z');
});

test('RegistrarTelemetriaCasoDeUso não grava leitura inválida', async () => {
  const repositorio = criarRepositorioFalso();
  const comando = RegistrarTelemetriaComando.aPartirDoEvento({ ...evento, dados: { ...evento.dados, lat: 200 } });

  await assert.rejects(() => new RegistrarTelemetriaCasoDeUso(repositorio).executar(comando), ErroDeValidacao);
  assert.equal(repositorio.leiturasSalvas.length, 0);
});

test('RegistrarTelemetriaCasoDeUso rejeita um adaptador que não implementa a porta', () => {
  assert.throws(() => new RegistrarTelemetriaCasoDeUso({} as PortaRepositorioDeLeituras), TypeError);
});
