# Microsserviço 2 — Frota (telemetria e entregas)

**Microsserviço de Frota**: veículos (telemetria OBD2/GPS) e projeção de entregas, com banco próprio — `pjbl_frota`. Consome as filas `pedidos-eventos` e `telemetria-veiculos` (Queue Trigger). Banco padrão: MongoDB Atlas free; adaptador **Azure SQL** pronto, ativado por `SQL_CONNECTION_STRING` (ver a limitação da assinatura Azure for Students no repositório guarda-chuva: `docs/LIMITACAO_AZURE_SQL.md`).

## Arquitetura da solução

```
Usuário ─► Microfrontend (React, Container Apps)
              │ HTTPS
              ▼
        API Gateway (Azure Function) ─► BFF Web (Azure Function)
                                            ├─► Serviço de Pedidos  ─► MongoDB Atlas (pjbl_pedidos) ─► fila pedidos-eventos
                                            ├─► Serviço de Frota    ─► MongoDB Atlas (pjbl_frota)  ◄─ filas pedidos-eventos / telemetria-veiculos
                                            └─► Função de Enriquecimento (HTTP Trigger, cálculo de risco)
```

Todos os backends seguem **Clean Architecture** (`dominio` → `aplicacao` → `features` → `infraestrutura`/`composicao`)
e **Vertical Slice** (uma pasta por caso de uso em `src/features/<área>/<fatia>/`), validados por testes de arquitetura
(ArchUnitTS) no repositório guarda-chuva: https://github.com/ViniciusVeiga2002/pjbl_arq_cloud.


## Tecnologias

- Node.js 22 + TypeScript
- Azure Functions v4 (plano de Consumo, serverless)
- Clean Architecture + Vertical Slice
- Testes: `node:test` + `tsx`
- Docker (imagem oficial `azure-functions/node`)
- MongoDB Atlas (padrão) / Azure SQL (`mssql`, opcional)
- Azure Queue Storage (eventos)

## Como rodar

**Em produção (nuvem)** — é o que a apresentação em vídeo demonstra:

- Swagger: https://pjbl-arq-cloud-frota.azurewebsites.net/api/docs
- Frontend: https://pjbl-frontend.greenground-94454a2d.eastus2.azurecontainerapps.io/
- Imagem Docker: https://hub.docker.com/r/viniciusveigadesantana/pjbl-servico-frota

**Localmente** (desenvolvimento):

```bash
npm install
cp local.settings.json.example local.settings.json   # ajuste as variáveis
npm start                                         # porta 7073
npm run simular-telemetria   # simulador OBD2 → fila

# imagem
docker build -t viniciusveigadesantana/pjbl-servico-frota:v1 .
docker run -p 8080:80 --env-file local.env viniciusveigadesantana/pjbl-servico-frota:v1
```

## Testes

```bash
npm test
```

## Links (nuvem)

| Item | URL |
| --- | --- |
| Frontend | https://pjbl-frontend.greenground-94454a2d.eastus2.azurecontainerapps.io/ |
| API Gateway (Swagger) | https://pjbl-arq-cloud-gateway.azurewebsites.net/api/docs |
| Repositório guarda-chuva (docs, Arc42, testes de arquitetura) | https://github.com/ViniciusVeiga2002/pjbl_arq_cloud |

## Alunos

- Fernando Padilha
- Hector Saldivar
- Theo Otto
- Vinicius Veiga

Disciplina: Arquitetura de Soluções / Computação em Nuvem — PUCPR (PJBL).
