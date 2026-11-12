# Limitação: Azure SQL (free offer) na assinatura Azure for Students

O enunciado pede o Microsserviço 2 em **Azure SQL Database (free)**. Na
conta usada pelo grupo (assinatura *Azure for Students*), isso **não foi
possível**. Evidências coletadas em 12/11/2026 com `az sql server create` /
`az sql db create`:

| Região (permitidas pela política da assinatura) | Resultado |
| --- | --- |
| `eastus2` | `RegionDoesNotAllowProvisioning` — "not accepting creation of new Windows Azure SQL Database servers" |
| `eastus` | `RegionDoesNotAllowProvisioning` (mesma mensagem) |
| `northcentralus` | `RegionDoesNotAllowProvisioning` (mesma mensagem) |
| `mexicocentral` | servidor criado, mas `az sql db create --use-free-limit` → `ProvisioningDisabled: Provisioning of free limit database is not supported for provided service level objective or region` |
| `brazilsouth` (e demais) | bloqueadas pela política *Allowed resource deployment regions* |

Criar um banco pago (Basic 5 DTU, ~US$ 5/mês) foi descartado por decisão do
grupo, para não gastar crédito.

## Decisão

O `servico-frota` grava no **MongoDB Atlas (M0, gratuito)**, em um banco
próprio (`pjbl_frota`, usuário exclusivo) — *Database per Service* continua
valendo: o serviço de pedidos usa `pjbl_pedidos` e o de frota usa `pjbl_frota`.

## O adaptador Azure SQL está pronto

Para não perder o requisito, o `servico-frota` já tem o adaptador completo
para Azure SQL (`src/infraestrutura/persistencia/ConexaoSqlServer.ts`,
`RepositorioDeVeiculosSql.ts`, `RepositorioDeEntregasSql.ts`: tabelas
`Veiculos` e `Entregas`, concorrência otimista, retry para o auto-pause).
A escolha é só de configuração, no Composition Root: **definir a variável
`SQL_CONNECTION_STRING` no Function App troca o banco do serviço de MongoDB
para Azure SQL, sem alterar nenhum caso de uso** — consequência direta da
Clean Architecture (a persistência é uma porta com dois adaptadores).

```bash
# em uma assinatura com o free offer (ou um banco pago):
az sql server create -n <servidor> -g <rg> -l <regiao> -u <admin> -p <senha>
az sql db create -g <rg> -s <servidor> -n pjbl_frota --use-free-limit --free-limit-exhaustion-behavior AutoPause
az functionapp config appsettings set -n pjbl-arq-cloud-frota -g <rg> \
  --settings "SQL_CONNECTION_STRING=Server=tcp:<servidor>.database.windows.net,1433;Database=pjbl_frota;User ID=<admin>;Password=<senha>;Encrypt=true"
```
