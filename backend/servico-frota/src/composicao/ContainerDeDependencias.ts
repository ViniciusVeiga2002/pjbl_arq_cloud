import { criarRepositorioDeLeituras, criarRepositorioDeConsultaDeVeiculos } from '../infraestrutura/persistencia/RepositorioDeVeiculosMongo';
import { criarRepositorioDeProjecao, criarRepositorioDeConsultaDeEntregas } from '../infraestrutura/persistencia/RepositorioDeEntregasMongo';

import RegistrarTelemetriaCasoDeUso from '../features/veiculos/registrar-telemetria/RegistrarTelemetriaCasoDeUso';
import ListarVeiculosCasoDeUso from '../features/veiculos/listar-veiculos/ListarVeiculosCasoDeUso';
import AtualizarProjecaoDeEntregaCasoDeUso from '../features/entregas/atualizar-projecao-de-entrega/AtualizarProjecaoDeEntregaCasoDeUso';
import ListarEntregasCasoDeUso from '../features/entregas/listar-entregas/ListarEntregasCasoDeUso';

// Composition Root do servico-frota: único módulo que liga os casos de uso
// às implementações concretas (MongoDB). As Functions — HTTP ou Queue
// Trigger — só conhecem estas fábricas.
export const criarRegistrarTelemetriaCasoDeUso = () => new RegistrarTelemetriaCasoDeUso(criarRepositorioDeLeituras());
export const criarListarVeiculosCasoDeUso = () => new ListarVeiculosCasoDeUso(criarRepositorioDeConsultaDeVeiculos());
export const criarAtualizarProjecaoDeEntregaCasoDeUso = () => new AtualizarProjecaoDeEntregaCasoDeUso(criarRepositorioDeProjecao());
export const criarListarEntregasCasoDeUso = () => new ListarEntregasCasoDeUso(criarRepositorioDeConsultaDeEntregas());
