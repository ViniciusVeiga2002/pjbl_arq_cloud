# Telemetria & Gestão de Entregas — PJBL

Plataforma de telemetria veicular e gestão de entregas para transportadoras
(persona principal: Coordenador de Frota). Arquitetura desta etapa:

- **Microfrontends** — `shell` (host) + `mfe-pedidos` e `mfe-frota`
  (remotos), integrados por Module Federation;
- **API Gateway** — única porta pública da API;
- **Backend for Frontend** — `bff-web`, que compõe os serviços para as telas;
- **Microsserviços + Database per Service** — `servico-pedidos`
  (banco `pjbl_pedidos`) e `servico-frota` (banco `pjbl_frota`);
- **Arquitetura Orientada a Eventos** — filas `pedidos-eventos` e
  `telemetria-veiculos` (Azure Queue Storage);
- **Serverless** — tudo em Azure Functions (plano de Consumo) e Azure
  Static Web Apps;
- **Clean Architecture + Vertical Slice** em todos os backends;
- **Testes Unitários de Arquitetura** verificando essas regras no código.

Integrantes: ver [GRUPO.md](GRUPO.md) — Fernando Padilha, Hector Saldivar,
Theo Otto e Vinicius Veiga. Prompts de IA generativa usados: [Prompt.md](Prompt.md).

## Links

- **Repositório:** https://github.com/ViniciusVeiga2002/pjbl_arq_cloud
- **Frontend (Azure Static Web Apps):** https://kind-water-063145a0f.7.azurestaticapps.net
- **API pública (API Gateway):** https://pjbl-arq-cloud-gateway.azurewebsites.net/api/web/
- **Documentação de arquitetura (Arc42):** [docs/arc42/](docs/arc42/) —
  roteiro de atualização desta etapa em
  [docs/arc42/ATUALIZACAO_ARC42_ETAPA2.md](docs/arc42/ATUALIZACAO_ARC42_ETAPA2.md),
  diagramas em [docs/arc42/diagramas/](docs/arc42/diagramas/)

## Estrutura

```
.
├── frontend/                      # npm workspaces
│   ├── shell/                     # host: layout, abas, carrega os remotos
│   ├── mfe-pedidos/               # remoto: tela Pedidos por Entrega
│   ├── mfe-frota/                 # remoto: tela Mapa da Frota
│   └── scripts/montar-dist.js     # junta os 3 builds em frontend/dist
├── backend/                       # 4 Function Apps independentes
│   ├── gateway/                   # API Gateway (porta 7070)
│   ├── bff-web/                   # Backend for Frontend (porta 7072)
│   ├── servico-pedidos/           # microsserviço + banco pjbl_pedidos (porta 7071)
│   └── servico-frota/             # microsserviço + banco pjbl_frota (porta 7073)
├── testes-arquitetura/            # 65 regras de arquitetura (node:test)
├── docker-compose.yml             # MongoDB ×2 + Azurite para rodar localmente
└── docs/arc42/                    # documentação de arquitetura e diagramas
```

Cada backend segue a mesma organização (Clean Architecture + Vertical Slice):

```
src/
├── dominio/                 # entidades, value objects, eventos, erros — sem bibliotecas
├── aplicacao/               # portas compartilhadas entre fatias
├── features/<área>/<fatia>/ # uma pasta por caso de uso:
│                            #   *Function.js (entrada) · *CasoDeUso.js · Porta* · Comando/Filtro
├── infraestrutura/          # MongoDB, fila, clientes HTTP, respostas HTTP
└── composicao/              # Composition Root: injeta a infraestrutura nos casos de uso
```

## Fluxo de uma requisição

```
Navegador ─► shell ─(Module Federation)─► mfe-pedidos / mfe-frota
                                              │ HTTPS /api/web/*
                                              ▼
                                         API Gateway ─► BFF Web ─┬─► Serviço de Pedidos ─► pjbl_pedidos
                                                                 │          │ publica eventos
                                                                 │          ▼
                                                                 │   fila pedidos-eventos
                                                                 │          │ Queue Trigger
                                                                 └─► Serviço de Frota ─► pjbl_frota
                                                                            ▲ Queue Trigger
                                         Dispositivo OBD2/GPS ─► fila telemetria-veiculos
```

## Rodar localmente

Pré-requisitos: Node.js 22+, Azure Functions Core Tools v4 e Docker.

```bash
# 1. Infraestrutura local: 2 MongoDB (um por serviço) + Azurite (filas)
docker compose up -d

# 2. Dependências
npm run instalar

# 3. Configuração local de cada Function App (valores já apontam para o docker compose)
for p in gateway bff-web servico-pedidos servico-frota; do
  cp -n backend/$p/local.settings.json.example backend/$p/local.settings.json
done

# 4. Os 4 Function Apps (um terminal para cada)
npm start --prefix backend/servico-pedidos   # 7071
npm start --prefix backend/bff-web           # 7072
npm start --prefix backend/servico-frota     # 7073
npm start --prefix backend/gateway           # 7070

# 5. Frontend composto (igual ao publicado), em http://localhost:4173
cd frontend && npm run build:local && npm run preview

# 6. Telemetria simulada dos veículos (OBD2/GPS → fila)
npm run simular-telemetria --prefix backend/servico-frota
```

Para desenvolver um microfrontend isolado: `npm run dev -w mfe-pedidos`
(porta 5174) ou `npm run dev -w mfe-frota` (porta 5175), dentro de
`frontend/`.

## Testes

```bash
npm test                    # tudo: unidade + arquitetura
npm run test:unidade        # 76 testes de unidade dos 4 backends
npm run test:arquitetura    # 65 regras de arquitetura
```

Os testes de arquitetura (`testes-arquitetura/`) leem os `require`/`import`
do código real e verificam: a Regra de Dependência da Clean Architecture,
o isolamento entre fatias verticais, a independência entre microsserviços e
seus bancos, que só o gateway é público e só roteia para BFFs, o contrato
de eventos entre produtor e consumidor e o isolamento entre
microfrontends. Rodam no GitHub Actions antes de qualquer deploy.

## Deploy

- `.github/workflows/testes.yml` — testes de unidade, de arquitetura e build
  do frontend em todo push/PR.
- `.github/workflows/backend-azure-functions.yml` — publica os 4 Function
  Apps (um job por serviço) depois dos testes.
- `.github/workflows/azure-static-web-apps-kind-water-063145a0f.yml` —
  publica shell + microfrontends no Static Web App depois dos testes.

## Histórico das atividades

Guias das etapas anteriores, mantidos como registro:
[GUIA_PASSO_A_PASSO.md](GUIA_PASSO_A_PASSO.md) (microfrontend + Function),
[GUIA_MONGODB_CRUD.md](GUIA_MONGODB_CRUD.md) e
[EVIDENCIAS_MONGODB.md](EVIDENCIAS_MONGODB.md) (CRUD com MongoDB),
[docs/backend-arquitetura/](docs/backend-arquitetura/) (refatoração para
Vertical Slice + Clean Architecture). Os caminhos citados neles (`api/…`)
referem-se à estrutura da época, hoje em `backend/servico-pedidos/`.
