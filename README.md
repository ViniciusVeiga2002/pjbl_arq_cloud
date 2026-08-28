# Telemetria & Gestão de Entregas — Atividade Formativa (Microfrontend + Azure Functions)

Frontend em React (Vite) que consome uma Azure Function para exibir duas telas
do projeto PJBL de telemetria veicular: **Mapa da frota** e **Pedidos por
entrega**. Ver `GRUPO.md` para os integrantes e `Prompt.md` para o prompt de
IAG utilizado.

## Links da entrega

> Preencha antes de submeter no AVA — estes 3 links são os exigidos pela atividade.

- **Site publicado (Azure Static Web Apps):** `https://SEU-SITE.azurestaticapps.net`
- **Repositório GitHub:** `https://github.com/SEU-USUARIO/SEU-REPO`
- **Azure Function (endpoint usado pelo frontend):** `https://SEU-SITE.azurestaticapps.net/api/pedidos`
- **Mock no Apidog (se utilizado para outras funcionalidades):** `https://mock.apidog.com/m1/SEU-PROJETO/...`

## Estrutura do repositório

```
.
├── GRUPO.md          # nome dos integrantes do grupo
├── Prompt.md          # prompt de IAG utilizado para gerar o frontend
├── README.md          # este arquivo
├── frontend/           # aplicação React (Vite)
└── api/                 # Azure Functions (Node.js, modelo v4)
```

## Rodando localmente

### 1. Azure Function (backend mock)

```bash
cd api
npm install
cp local.settings.json.example local.settings.json
npm start        # inicia em http://localhost:7071 (requer Azure Functions Core Tools)
```

Teste no navegador: http://localhost:7071/api/pedidos

### 2. Frontend

Em outro terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev       # abre em http://localhost:5173
```

Se a Function não estiver rodando, o frontend continua funcionando com dados
mock locais (ver `src/services/api.js`).

### 3. Mock Server do Apidog (opcional)

A tela "Mapa da frota" (`GET /veiculos`) e a ação "Concluir entrega"
(`POST /entregas/{id}/concluir`) consomem o Mock Server do Apidog, não a
Azure Function. Para ligar isso:

1. Crie um projeto gratuito em [apidog.com](https://apidog.com/pt-BR/) com os
   dois endpoints acima e ative o **Mock Server** do projeto.
2. Copie a URL base gerada (ex.: `https://mock.apidog.com/m1/SEU-PROJETO-ID`)
   para `VITE_APIDOG_BASE_URL` em `frontend/.env.local`.
3. Sem essa variável configurada, essas duas funcionalidades caem
   automaticamente no mock local (mesmo padrão de fallback usado para a
   Azure Function).

## Deploy

1. Suba este repositório para o GitHub.
2. No portal do Azure, crie um recurso **Static Web App**, conectando-o a
   este repositório/branch (isso cria automaticamente um workflow do GitHub
   Actions que faz o build e publica a cada push).
3. Configuração de build sugerida:
   - **App location:** `frontend`
   - **Api location:** `api`
   - **Output location:** `dist`
4. Após o deploy, copie a URL gerada (`https://xxxxx.azurestaticapps.net`) e
   atualize a seção **Links da entrega** acima.

Veja o guia completo (`GUIA_PASSO_A_PASSO.md`, enviado junto com este
repositório) para o passo a passo detalhado, incluindo capturas de tela do
portal do Azure.
