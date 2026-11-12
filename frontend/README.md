# Microfrontend — Telemetria & Gestão de Entregas

**Microfrontend (SPA React)** com Module Federation: `shell` (host) + `mfe-pedidos` e `mfe-frota` (remotos). O frontend **só chama o API Gateway** (que roteia para o BFF) — nunca um microsserviço diretamente.

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

- React + TypeScript + Vite
- Module Federation (shell + 2 remotos)
- nginx (imagem Docker) em Azure Container Apps

## Como rodar

**Em produção (nuvem):** https://pjbl-frontend.greenground-94454a2d.eastus2.azurecontainerapps.io/ — imagem: https://hub.docker.com/r/viniciusveigadesantana/pjbl-frontend

**Localmente:**

```bash
npm install
npm run build:local && npm run preview   # http://localhost:4173
# imagem
docker build -t viniciusveigadesantana/pjbl-frontend:v1 --build-arg VITE_GATEWAY_URL=https://pjbl-arq-cloud-gateway.azurewebsites.net/api .
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
