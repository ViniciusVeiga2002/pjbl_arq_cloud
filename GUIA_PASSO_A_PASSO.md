# Guia passo a passo — Atividade Formativa 0.1 (Microfrontend + Azure Functions)

Este guia explica, passo a passo, como cumprir a atividade "Padrões e
Estilos Arquiteturais" do professor Manoel Valerio, usando como base o
projeto PJBL de telemetria veicular (OBD2 + app mobile + dashboard de
gestão de entregas) descrito no documento de personas do grupo. Junto com
este guia você recebeu um repositório inicial já funcional (`frontend/` +
`api/`) com as duas telas do Coordenador de Frota e um endpoint GET de
Azure Function — use-o como ponto de partida e adapte ao seu grupo.

## 1. O que exatamente precisa ser entregue

Antes de programar, é importante ter claro o checklist da atividade (slide
19 do material):

| Item | O que é | Onde fica |
|---|---|---|
| Frontend | Comunica-se com Azure Functions e mock backend. React e Module Federation são opcionais. | pasta `frontend/` |
| Duas telas | No mínimo duas funcionalidades/telas do projeto PJBL. | `frontend/src/pages/` |
| `GRUPO.md` | Nome dos integrantes do grupo. | raiz do repositório |
| Endpoint GET | Frontend consome pelo menos 1 GET de Azure Functions com dados mock. | `api/` |
| `Prompt.md` | Prompt usado na IAG para gerar o frontend. | raiz do repositório |
| Publicação | Site publicado no Azure Static Web Apps. | portal do Azure |
| `README.md` | Endereço do site no Azure e, se usado, endereços do Apidog. | raiz do repositório |
| AVA | Link público do GitHub e da Azure Function informados na entrega. | ambiente da disciplina |

Tudo isso já está esqueletado no repositório que acompanha este guia — o
que falta é você rodar, entender, ajustar ao seu grupo e publicar.

## 2. Como isso se conecta ao projeto de vocês

O documento de personas do grupo define três perfis: **Motorista**
(Juliana), **Coordenador de Frota** (Marcos) e **Diretor de Logística**
(Roberto), com os requisitos funcionais RF01 a RF14. Para esta atividade
específica (que pede só 2 telas, não o sistema completo), o repositório
inicial implementa a visão do **Coordenador de Frota**:

- **Mapa da frota** — atende RF06 (mapa em tempo real) e dá uma pista
  visual de RF08/RF09 (alertas de velocidade e condição mecânica).
- **Pedidos por entrega** — atende RF05 e RF07 (pedidos vinculados a cada
  entrega em andamento), e é a tela que fala com a Azure Function.

Se o seu grupo preferir outra combinação (por exemplo, a tela do motorista
com a lista de entregas do dia, RF07/RF10), o padrão de código é o mesmo:
duplique um arquivo em `src/pages/`, ajuste os dados em
`src/services/api.js` e registre a nova tela em `src/App.jsx`. O importante
para a nota não é qual tela exatamente, e sim que ela seja rastreável até
uma persona e um RF da própria documentação do grupo.

## 3. Arquitetura da solução

```
[ Browser ]
     │
     ▼
[ Frontend React (Vite) ]  ── build estático (dist/) ──▶  [ Azure Static Web Apps ]
     │  fetch GET /api/pedidos
     ▼
[ Azure Function (Node.js) ]  ──▶  dados mock em memória
```

Quando o Static Web App é criado apontando para uma pasta `api/` no mesmo
repositório, o Azure publica a Function automaticamente "grudada" ao
mesmo domínio do site — por isso o frontend chama simplesmente
`/api/pedidos`, sem precisar de URL nem de configurar CORS manualmente em
produção (o `services/api.js` do repositório já está preparado para isso).

Para telas que não fazem parte do requisito obrigatório (o GET da Function),
a atividade sugere usar o **Apidog** para criar um mock HTTP independente —
é uma alternativa rápida a escrever uma segunda Function, útil se o grupo
quiser simular endpoints de POST/PUT sem implementar um backend real.

## 4. Pré-requisitos

- Conta no GitHub (você já tem).
- Conta no Azure, com uma assinatura ativa — Azure for Students funciona
  bem, pois dá créditos sem exigir cartão (você já tem).
- Node.js 18+ instalado na máquina (`node --version`).
- Git instalado e configurado (`git --version`).
- Opcional, só se quiser rodar a Function localmente antes de publicar:
  [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local).
  Não é obrigatório — dá para pular direto para o deploy e testar já em
  produção.

## 5. Gerando (ou regerando) o frontend com IAG

O repositório já entregue foi gerado com Claude a partir da documentação do
projeto e do prompt registrado em `Prompt.md`. Isso já cumpre o requisito
"Utilizar IAG" — mas vale entender o processo para quando o grupo quiser
pedir ajustes:

1. Abra o Claude (claude.ai, ou Claude Code se preferir linha de comando).
2. Cole a documentação de personas/RFs do grupo (ou resuma o essencial).
3. Escreva um prompt específico, dizendo: framework (React/Vite), quais
   telas, quais dados cada tela precisa mostrar, e que uma delas deve
   consumir um GET de Azure Function com fallback para mock local. O
   prompt completo usado para gerar este repositório está em `Prompt.md` —
   use-o como modelo.
4. **Sempre que pedir uma alteração relevante à IAG, copie o prompt usado
   para dentro de `Prompt.md`**, com data e nome de quem pediu. É isso que
   o professor vai conferir.

## 6. Rodando o projeto localmente

Antes de publicar, vale testar na sua máquina.

**Terminal 1 — Function (backend mock):**

```bash
cd api
npm install
cp local.settings.json.example local.settings.json
npm start
```

Isso sobe a Function em `http://localhost:7071`. Teste abrindo
`http://localhost:7071/api/pedidos` no navegador — deve aparecer um JSON
com a lista de pedidos mock.

**Terminal 2 — Frontend:**

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Abra `http://localhost:5173`. Você deve ver as duas abas ("Mapa da frota"
e "Pedidos por entrega"); a segunda busca os dados na Function que você
subiu no Terminal 1. Se você pular o Terminal 1, a tela continua
funcionando com o mock local embutido no frontend (é só um fallback de
desenvolvimento — em produção o requisito é a chamada real à Function).

## 7. Adaptando ao seu grupo

- Edite `GRUPO.md` com o nome completo de cada integrante.
- Se for trocar as telas, siga o padrão descrito na seção 2.
- Se quiser mudar os dados mock (nomes de clientes, placas, status),
  edite os arrays em `api/src/functions/getPedidos.js` (backend) e
  `frontend/src/services/api.js` (fallback local) — mantenha os dois em
  sincronia para não confundir durante a demonstração.

## 8. (Opcional) Mock adicional com Apidog

Use isso se quiser simular outro endpoint sem escrever uma segunda Azure
Function (por exemplo, POST de "registrar entrega concluída", RF10):

1. Acesse [apidog.com](https://apidog.com/pt-BR/) e crie uma conta gratuita.
2. Crie um novo projeto e, dentro dele, um endpoint (ex.: `POST /entregas/{id}/concluir`).
3. Defina o corpo da resposta mock (JSON de exemplo).
4. Ative o **Mock Server** do Apidog para esse projeto — ele gera uma URL
   pública do tipo `https://mock.apidog.com/m1/SEU-PROJETO-ID/...`.
5. No frontend, aponte um `fetch` para essa URL exatamente como se fosse
   uma API real.
6. Copie a URL gerada para o `README.md`, na linha "Mock no Apidog".

## 9. Subindo o repositório para o GitHub

Se você for usar o repositório que veio com este guia como ponto de
partida:

```bash
cd caminho/para/atividade-mfe-frota
git init
git add .
git commit -m "Base do frontend + Azure Function (gerado com IAG)"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
git push -u origin main
```

Crie o repositório vazio no GitHub antes (botão "New repository"), sem
inicializar com README, para não dar conflito no primeiro push.

## 10. Publicando no Azure Static Web Apps

Este é o passo que o professor demonstrou em aula. Siga exatamente assim:

1. Acesse [portal.azure.com](https://portal.azure.com) e clique em
   **Create a resource**.
2. Na busca do Marketplace, digite **Static Web App** e selecione o
   serviço da Microsoft.
3. Escolha a **Subscription** (ex.: "Azure for Students") e clique em
   **Create**.
4. Na tela **Create Static Web App**, aba **Basics**:
   - **Resource Group:** crie um novo (ex.: `rg-telemetria-frota`).
   - **Name:** um nome único (ex.: `telemetria-frota-grupoX`) — esse nome
     vira parte da URL pública.
   - **Plan type:** **Free** (suficiente para a atividade).
   - **Deployment details → Source:** **GitHub**.
   - Clique em **Sign in with GitHub** e autorize o Azure a acessar sua
     conta.
5. Ainda na aba Basics, selecione:
   - **Organization:** seu usuário/organização do GitHub.
   - **Repository:** o repositório que você acabou de subir.
   - **Branch:** `main`.
6. Clique em **Next: Deployment configuration**. Aqui é onde a maioria dos
   erros de build acontece — preencha exatamente:
   - **Build Presets:** React.
   - **App location:** `frontend`
   - **Api location:** `api`
   - **Output location:** `dist`

   > Se o preset "React" preencher `Output location` como `build` em vez
   > de `dist`, corrija manualmente para `dist` — é o nome da pasta que o
   > Vite gera (diferente do Create React App, que usa `build`).
7. Vá até a aba **Advanced**. Em **Region for Azure Functions API and
   staging environments**, escolha uma região próxima (ex.: `Brazil
   South` ou `East US 2`). **Se a criação falhar por causa da região,
   volte aqui e tente outra** — isso é comum e foi avisado pelo próprio
   professor no material da disciplina.
8. Clique em **Review + create** e depois em **Create**.
9. Aguarde a mensagem **"Your deployment is complete"** e clique em
   **Go to resource**.
10. Na página do recurso, copie a **URL** que aparece em **Essentials**
    (algo como `https://nome-aleatorio-0000.azurestaticapps.net`) — é o
    endereço que vai para o `README.md`.
11. Criar o recurso já dispara automaticamente um **GitHub Actions
    workflow** (`.github/workflows/azure-static-web-apps-*.yml`) no seu
    repositório, que faz o build e o deploy. Acompanhe em **Deployment
    history**, dentro do recurso no Azure, ou na aba **Actions** do seu
    repositório no GitHub. O primeiro deploy some minutos; se aparecer
    **Failed**, veja a seção de erros comuns abaixo.
12. Quando o workflow mais recente aparecer como **Succeeded**, abra a URL
    do site — as duas telas devem carregar, e a aba "Pedidos por entrega"
    deve mostrar dados vindos da Function publicada (não mais o mock
    local do navegador).

## 11. Preenchendo os arquivos finais

Com o site no ar, edite:

- **`README.md`** — troque os placeholders pela URL real do Azure Static
  Web Apps, pelo link do endpoint (`https://SEU-SITE.azurestaticapps.net/api/pedidos`)
  e, se usou, a URL do mock do Apidog.
- **`GRUPO.md`** — confirme que os nomes estão completos.
- **`Prompt.md`** — confirme que reflete o(s) prompt(s) realmente usados
  pelo grupo (adicione os seus, se pediram ajustes além do prompt inicial).

Faça commit e push dessas mudanças:

```bash
git add README.md GRUPO.md Prompt.md
git commit -m "Preenche links de entrega e integrantes do grupo"
git push
```

## 12. Entregando no AVA

No ambiente virtual de aprendizagem, informe dois links públicos:

1. O repositório no GitHub (`https://github.com/SEU-USUARIO/SEU-REPO`).
2. O endereço da Azure Function (pode ser a URL do site + `/api/pedidos`,
   já que a Function está publicada junto do Static Web App).

## 13. Checklist final

Confira cada item antes de entregar:

- [ ] `GRUPO.md` com o nome de todos os integrantes.
- [ ] Pelo menos duas telas do projeto PJBL implementadas.
- [ ] Frontend chamando `GET /api/pedidos` (ou equivalente) e recebendo
      dados mock da Azure Function em produção (não só o fallback local).
- [ ] `Prompt.md` preenchido com o prompt real usado na IAG.
- [ ] Site publicado e acessível no Azure Static Web Apps.
- [ ] `README.md` com a URL do site (e do Apidog, se usado).
- [ ] Links do GitHub e da Function informados no AVA.

## 14. Erros comuns

- **Erro de criação por região indisponível:** volte à aba Advanced e
  escolha outra região para "Azure Functions API and staging
  environments" (ex.: trocar `East US 2` por `East US` ou `West US 2`).
- **Build falha no GitHub Actions com "Output location not found" ou
  similar:** confira se `Output location` está como `dist` (Vite) e
  `App location` como `frontend` — esse é o erro mais comum ao usar Vite
  em vez de Create React App.
- **Tela em produção mostra os dados mock "locais" em vez dos da Function:**
  normalmente é porque a pasta `Api location` não foi preenchida como
  `api` na configuração de deployment, então a Function não foi publicada
  junto. Confira em **Settings → APIs** no recurso do Static Web App se
  uma Function aparece linkada.
- **CORS bloqueando a chamada em desenvolvimento local:** ao rodar a
  Function localmente com `func start`, garanta que `local.settings.json`
  tem `"Host": { "CORS": "*" }` (já vem assim no
  `local.settings.json.example`).
- **`npm install` falha na pasta `api`:** confirme que tem Node.js 18+
  instalado; a Azure Functions Core Tools só é necessária se você quiser
  rodar a Function localmente — não é necessária para o deploy via GitHub
  Actions, que builda tudo no servidor do Azure.

## 15. Onde estudar mais (material da disciplina)

- Microfrontend e Module Federation: slides 6–14 do material de aula.
- Swagger/OpenAPI para documentar a Function como um "contrato" de API:
  slides 15–17.
- Documentação oficial do Azure Static Web Apps:
  [Microsoft Learn — Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/).
- Documentação oficial do modelo de programação v4 do Azure Functions em
  Node.js: [Microsoft Learn — Azure Functions Node.js developer guide](https://learn.microsoft.com/azure/azure-functions/functions-reference-node).
