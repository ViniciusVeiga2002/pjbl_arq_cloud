# API Gateway

**API Gateway** — única porta pública da API. Faz roteamento (`/api/web/*` → BFF Web), CORS, limite de requisições (120/min por IP), `x-correlation-id` e segurança (a chave do BFF fica só aqui).

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

## Como rodar

**Em produção (nuvem)** — é o que a apresentação em vídeo demonstra:

- Swagger: https://pjbl-arq-cloud-gateway.azurewebsites.net/api/docs
- Frontend: https://pjbl-frontend.greenground-94454a2d.eastus2.azurecontainerapps.io/
- Imagem Docker: https://hub.docker.com/r/viniciusveigadesantana/pjbl-gateway

**Localmente** (desenvolvimento):

```bash
npm install
cp local.settings.json.example local.settings.json   # ajuste as variáveis
npm start                                         # porta 7070


# imagem
docker build -t viniciusveigadesantana/pjbl-gateway:v1 .
docker run -p 8080:80 --env-file local.env viniciusveigadesantana/pjbl-gateway:v1
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
