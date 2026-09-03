# Guia — MongoDB Atlas + 4 Azure Functions de CRUD

Este guia continua a atividade anterior (`GUIA_PASSO_A_PASSO.md`). Se vocês
já publicaram o site no Azure Static Web Apps, os passos abaixo evoluem o
mesmo repositório: a tela "Pedidos por entrega" passa a ler e gravar num
banco de dados real (MongoDB Atlas) através de 4 Azure Functions —
pesquisar, inserir, alterar e excluir.

## 1. O que já está pronto no repositório

- `api/src/lib/mongoClient.js` — conexão única e reaproveitada com o
  MongoDB Atlas.
- `api/src/functions/searchPedidos.js` — **GET** `/api/pedidos` (pesquisar,
  com filtros opcionais `cliente`, `status`, `entregaId`, `id`).
- `api/src/functions/createPedido.js` — **POST** `/api/pedidos` (inserir).
- `api/src/functions/updatePedido.js` — **PUT** `/api/pedidos/{id}` (alterar).
- `api/src/functions/deletePedido.js` — **DELETE** `/api/pedidos/{id}` (excluir).
- `frontend/src/pages/PedidosEntrega.jsx` — tela com busca, formulário de
  cadastro, edição inline e exclusão, chamando as 4 Functions acima.

O que falta é só a parte que só vocês podem fazer: criar a conta e o banco
de verdade no MongoDB Atlas, e configurar a string de conexão.

## 2. Criando a conta de estudante no MongoDB

1. Acesse https://www.mongodb.com/students.
2. Essa página pede o **GitHub Student Developer Pack** para liberar
   créditos extras. Se vocês já têm o Student Pack ativo, entrem com a
   mesma conta GitHub e sigam a verificação.
3. **A verificação do Student Pack pode demorar horas ou dias.** Para não
   travar a entrega, o caminho recomendado é: criem a conta gratuita
   normal do MongoDB Atlas em https://www.mongodb.com/cloud/atlas/register
   (com e-mail institucional ou pessoal) — o **tier gratuito M0** já é
   suficiente para esta atividade e não exige cartão de crédito. Se o
   Student Pack for aprovado depois, dá pra vincular os créditos à mesma
   organização sem perder o cluster já criado.
4. Confirme o e-mail de verificação.

## 3. Criando o banco de dados no Atlas

1. No painel do Atlas, clique em **Build a Database**.
2. Escolha o plano **M0 Free**.
3. Provider/Region: qualquer provedor, escolha uma região próxima (ex.:
   AWS `São Paulo (sa-east-1)`).
4. Dê um nome ao cluster (ex.: `pjbl-cluster`) e clique em **Create**.
5. Em **Security Quickstart**:
   - **Username/Password:** crie um usuário de banco (ex.: `pjbl_app`) com
     uma senha forte — **anote essa senha**, ela entra na connection
     string.
   - **Network Access:** para esta atividade, adicione
     `0.0.0.0/0` ("Allow access from anywhere"). Isso é necessário porque
     o plano gratuito de Azure Functions usa IPs de saída dinâmicos — não
     dá pra prever qual IP a Function vai usar. **Isso é aceitável para um
     exercício acadêmico**, mas nunca deve ser feito assim num banco com
     dados reais em produção.
6. Clique em **Finish and Close**.
7. Dentro do cluster, vá em **Browse Collections → Add My Own Data** e
   crie o banco `pjbl_telemetria` com a coleção `pedidos` (mesmo nome
   usado pelas Functions — se o banco/coleção não existir ainda, o
   MongoDB cria automaticamente no primeiro `insertOne`, então esse passo
   é opcional, mas ajuda a visualizar o banco vazio como evidência).

## 4. Pegando a connection string

1. No cluster, clique em **Connect**.
2. Escolha **Drivers**.
3. Selecione **Node.js** e a versão mais recente.
4. Copie a string, algo como:
   ```
   mongodb+srv://pjbl_app:<db_password>@pjbl-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Troque `<db_password>` pela senha real do usuário criado no passo 3.

## 5. Configurando as variáveis de ambiente

**Localmente**, dentro de `api/`:

```bash
cd api
cp local.settings.json.example local.settings.json
```

Edite `local.settings.json` e substitua:
- `MONGODB_URI` pela connection string do passo 4.
- `MONGODB_DB` pode ficar `pjbl_telemetria` (ou o nome que preferirem).

`local.settings.json` já está no `.gitignore` — **nunca** commitem senha de
banco no Git.

## 6. Testando localmente antes de publicar

```bash
cd api
npm install
npm start
```

Em outro terminal, teste as 4 operações com `curl` (ou o app.rest/Postman,
se preferirem):

```bash
# Inserir
curl -X POST http://localhost:7071/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{"cliente":"Distribuidora Norte","entregaId":"ENT-501","veiculoPlaca":"ABC-1D23","status":"Em rota"}'

# Pesquisar (todos, ou filtrando por cliente)
curl http://localhost:7071/api/pedidos
curl "http://localhost:7071/api/pedidos?cliente=Norte"

# Alterar (troque PED-XXXXXX pelo id retornado no insert)
curl -X PUT http://localhost:7071/api/pedidos/PED-XXXXXX \
  -H "Content-Type: application/json" \
  -d '{"status":"Entregue"}'

# Excluir
curl -X DELETE http://localhost:7071/api/pedidos/PED-XXXXXX
```

Se cada comando responder com JSON (e não erro de conexão), o CRUD com o
MongoDB Atlas está funcionando localmente. Vale a pena atualizar a página
do cluster no Atlas (**Browse Collections**) e ver o documento aparecendo/
sumindo em tempo real — ótima evidência para o print pedido na atividade.

Depois, rode o frontend (`cd frontend && npm run dev`) e use a tela
"Pedidos por entrega" para pesquisar, cadastrar, editar e excluir pela
interface.

## 7. Configurando em produção (Azure)

O deploy já existe (do guia anterior). Falta só apontar a Function
publicada para o mesmo MongoDB:

1. No [portal do Azure](https://portal.azure.com), abra o recurso do
   Static Web App.
2. No menu lateral, vá em **Settings → APIs** e confirme que a Function
   App vinculada aparece ali (ela foi criada automaticamente junto do
   Static Web App).
3. Clique nessa Function App vinculada (ou vá em **Settings →
   Environment variables**, dependendo da versão do portal) e adicione as
   mesmas duas variáveis usadas localmente:
   - `MONGODB_URI`
   - `MONGODB_DB`
4. Salve. Pode levar 1-2 minutos para a Function reiniciar com as novas
   variáveis.
5. Não é preciso alterar código nem fazer novo `git push` só por causa
   disso — é configuração do ambiente, não do repositório. Mas se vocês
   já tinham feito outras alterações, façam commit e push normalmente;
   isso vai disparar o GitHub Actions e publicar de novo.
6. Teste no navegador: `https://SEU-SITE.azurestaticapps.net/api/pedidos`
   deve responder com a lista (ou `[]`, se ainda não inseriram nada).

## 8. Checklist de evidências

Ver `EVIDENCIAS_MONGODB.md` para o documento final, mas em resumo, tirem
print de:

1. **MongoDB Atlas** — tela do cluster criado e da coleção `pedidos` com
   pelo menos um documento inserido (aba **Browse Collections**).
2. **Azure Portal** — as 4 Functions listadas dentro da Function App do
   Static Web App (menu **Functions**), mostrando `searchPedidos`,
   `createPedido`, `updatePedido`, `deletePedido`.
3. **Frontend em produção** — a tela "Pedidos por entrega" com um pedido
   cadastrado por vocês, e (se possível) a aba **Network** do DevTools do
   navegador mostrando as chamadas `GET`, `POST`, `PUT` e `DELETE` para
   `/api/pedidos` com status `200`/`201`.

## 9. Erros comuns

- **`MongoServerSelectionError` / timeout ao conectar:** geralmente é
  Network Access no Atlas sem o `0.0.0.0/0` liberado, ou senha errada na
  connection string (caracteres especiais na senha precisam de
  URL-encoding, ex.: `@` vira `%40`).
- **Function retorna 500 com "MONGODB_URI não configurada":** falta
  configurar a variável — localmente em `local.settings.json`, em
  produção em **Application settings**/**Environment variables** da
  Function App.
- **Dados somem depois de um tempo/reinício:** conferir se a Function
  realmente está gravando no Atlas (aba Browse Collections) e não caindo
  no fallback local do frontend (acontece quando a Function está fora do
  ar ou com erro — veja o console do navegador, `services/api.js` sempre
  loga um `console.warn` quando cai no fallback).
- **CORS bloqueado ao chamar `PUT`/`DELETE` localmente:** confirme que
  `local.settings.json` tem `"Host": { "CORS": "*" }`.
