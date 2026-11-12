import { criarRepositorioDeLeituras as leiturasMongo, criarRepositorioDeConsultaDeVeiculos as consultaVeiculosMongo } from '../infraestrutura/persistencia/RepositorioDeVeiculosMongo';
import { criarRepositorioDeProjecao as projecaoMongo, criarRepositorioDeConsultaDeEntregas as consultaEntregasMongo } from '../infraestrutura/persistencia/RepositorioDeEntregasMongo';
import { criarRepositorioDeLeituras as leiturasSql, criarRepositorioDeConsultaDeVeiculos as consultaVeiculosSql } from '../infraestrutura/persistencia/RepositorioDeVeiculosSql';
import { criarRepositorioDeProjecao as projecaoSql, criarRepositorioDeConsultaDeEntregas as consultaEntregasSql } from '../infraestrutura/persistencia/RepositorioDeEntregasSql';

import RegistrarTelemetriaCasoDeUso from '../features/veiculos/registrar-telemetria/RegistrarTelemetriaCasoDeUso';
import ListarVeiculosCasoDeUso from '../features/veiculos/listar-veiculos/ListarVeiculosCasoDeUso';
import AtualizarProjecaoDeEntregaCasoDeUso from '../features/entregas/atualizar-projecao-de-entrega/AtualizarProjecaoDeEntregaCasoDeUso';
import ListarEntregasCasoDeUso from '../features/entregas/listar-entregas/ListarEntregasCasoDeUso';

// Composition Root do servico-frota: único módulo que liga os casos de uso
// às implementações concretas de persistência.
//
// Banco do serviço — escolhido por configuração, sem tocar nos casos de uso:
//  - MongoDB Atlas (padrão, tier gratuito): variável MONGODB_URI.
//  - Azure SQL Database: basta definir SQL_CONNECTION_STRING. O adaptador
//    SQL está implementado e pronto, mas não foi o usado na entrega: a
//    assinatura Azure for Students não tem o free offer do Azure SQL nas
//    regiões permitidas (ver docs/LIMITACAO_AZURE_SQL.md).
const usarSql = () => Boolean(process.env.SQL_CONNECTION_STRING);

export const criarRegistrarTelemetriaCasoDeUso = () =>
  new RegistrarTelemetriaCasoDeUso(usarSql() ? leiturasSql() : leiturasMongo());
export const criarListarVeiculosCasoDeUso = () =>
  new ListarVeiculosCasoDeUso(usarSql() ? consultaVeiculosSql() : consultaVeiculosMongo());
export const criarAtualizarProjecaoDeEntregaCasoDeUso = () =>
  new AtualizarProjecaoDeEntregaCasoDeUso(usarSql() ? projecaoSql() : projecaoMongo());
export const criarListarEntregasCasoDeUso = () =>
  new ListarEntregasCasoDeUso(usarSql() ? consultaEntregasSql() : consultaEntregasMongo());
