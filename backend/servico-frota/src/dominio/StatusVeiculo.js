// Value Object: situação de um veículo, derivada da última leitura de
// telemetria. Os valores são os mesmos que o microfrontend da frota já
// exibia (RF06/RF08).
const StatusVeiculo = Object.freeze({
  OK: 'ok',
  PARADO: 'parado',
  ALERTA_VELOCIDADE: 'alerta-velocidade',
});

module.exports = StatusVeiculo;
