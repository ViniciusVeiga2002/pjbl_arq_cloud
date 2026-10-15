const {
  criarRepositorioDeLeituras,
  criarRepositorioDeConsultaDeVeiculos,
} = require('../infraestrutura/persistencia/RepositorioDeVeiculosMongo');
const {
  criarRepositorioDeProjecao,
  criarRepositorioDeConsultaDeEntregas,
} = require('../infraestrutura/persistencia/RepositorioDeEntregasMongo');

const RegistrarTelemetriaCasoDeUso = require('../features/veiculos/registrar-telemetria/RegistrarTelemetriaCasoDeUso');
const ListarVeiculosCasoDeUso = require('../features/veiculos/listar-veiculos/ListarVeiculosCasoDeUso');
const AtualizarProjecaoDeEntregaCasoDeUso = require('../features/entregas/atualizar-projecao-de-entrega/AtualizarProjecaoDeEntregaCasoDeUso');
const ListarEntregasCasoDeUso = require('../features/entregas/listar-entregas/ListarEntregasCasoDeUso');

// Composition Root do servico-frota: único módulo que liga os casos de uso
// às implementações concretas (MongoDB). As Functions — HTTP ou Queue
// Trigger — só conhecem estas fábricas.
module.exports = {
  criarRegistrarTelemetriaCasoDeUso: () => new RegistrarTelemetriaCasoDeUso(criarRepositorioDeLeituras()),
  criarListarVeiculosCasoDeUso: () => new ListarVeiculosCasoDeUso(criarRepositorioDeConsultaDeVeiculos()),
  criarAtualizarProjecaoDeEntregaCasoDeUso: () => new AtualizarProjecaoDeEntregaCasoDeUso(criarRepositorioDeProjecao()),
  criarListarEntregasCasoDeUso: () => new ListarEntregasCasoDeUso(criarRepositorioDeConsultaDeEntregas()),
};
