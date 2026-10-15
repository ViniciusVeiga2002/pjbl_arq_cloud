# Prompt.md

Registro do prompt utilizado com IA Generativa (IAG) para gerar a base deste frontend, conforme exigido pela atividade formativa.

## Ferramenta utilizada

Claude (Anthropic).

## Prompt utilizado

```
Com base na documentação de personas e requisitos funcionais (RF01-RF14) do
meu projeto PJBL — uma plataforma de telemetria veicular via OBD2 + app
mobile + dashboard de gestão de entregas para transportadoras — e no material
de aula sobre Microfrontend, Module Federation e Azure Static Web Apps,
gere um frontend em React (Vite) com duas telas para a persona
"Coordenador de Frota":

1. Mapa da frota (RF06/RF08/RF09): lista/mapa com posição atual de cada
   veículo, velocidade e um indicador visual de alerta quando o veículo
   estiver com excesso de velocidade.
2. Pedidos por entrega (RF05/RF07): lista de pedidos vinculados a cada
   entrega em andamento, com status (em rota, entregue, atrasado) e
   previsão de entrega.

Requisitos técnicos:
- A tela de pedidos deve consumir a lista via GET em uma Azure Function
  (endpoint /api/pedidos), com fallback para um mock local caso a Function
  não esteja disponível.
- Organize o código em src/pages (telas), src/services/api.js (acesso a
  dados) e um App.jsx com navegação simples por abas entre as duas telas.
- Também gere a Azure Function (Node.js, modelo de programação v4) que
  implementa GET /api/pedidos, retornando os mesmos dados mock em JSON, com
  CORS liberado.
- Comente o código explicando as decisões, pois o objetivo é uso didático
  (disciplina de arquitetura de soluções em nuvem).
```

## Ajuste — 2026-08-28 (Vinicius Veiga)

Prompt utilizado para pedir ajustes à IAG (Claude Code), em duas partes:

```
1. Os dados sempre serão os mesmos no front? Preciso que a API gere dados
   aleatórios, pra isso servia o mock.

2. Tenho que ter o mock com Apidog mesmo, como faço para adaptar ao nosso
   projeto?
```

O que foi alterado a partir disso:
- `api/src/functions/getPedidos.js` passou a gerar de 4 a 8 pedidos
  aleatórios a cada chamada (cliente, status e previsão de entrega
  variam), em vez de retornar sempre o mesmo array fixo.
- Novos endpoints simulados no Mock Server do Apidog:
  `GET /veiculos` (mapa da frota) e `POST /entregas/{id}/concluir`
  (marcar entrega como concluída, RF10).
- `frontend/src/services/api.js` passou a consumir esses dois endpoints
  do Apidog (`VITE_APIDOG_BASE_URL`), com fallback para o mock local
  quando a URL não está configurada ou a chamada falha.
- Botão "Concluir entrega" adicionado à tela "Pedidos por entrega".


## Ajuste — 2026-09-03 (Vinicius Veiga)

Prompt utilizado para pedir a extensão de CRUD com MongoDB (Claude, via Cowork):

```
Criar uma conta de estudante para o banco de dados MongoDB (MongoDB Student
Pack). Criar um banco de dados no MongoDB Atlas. Criar 4 Azure Functions
para a aplicação PJBL: inserir, alterar, excluir e pesquisar. O frontend
criado anteriormente deve executar as 4 Azure Functions. Entregar evidência
da criação do banco de dados MongoDB, evidência da criação das 4 Azure
Functions e evidência do frontend executando as 4 Azure Functions. Informar
no documento o nome dos alunos que realizaram a atividade.
```

O que foi alterado a partir disso:
- `api/src/functions/getPedidos.js` foi renomeado para `searchPedidos.js` e
  passou a consultar o MongoDB Atlas (coleção `pedidos`) em vez de gerar
  dados aleatórios em memória. Aceita filtros por `cliente`, `status`,
  `entregaId` e `id` via query string (função "pesquisar").
- Três novas Azure Functions: `createPedido.js` (POST, "inserir"),
  `updatePedido.js` (PUT `/pedidos/{id}`, "alterar") e `deletePedido.js`
  (DELETE `/pedidos/{id}`, "excluir") — as 4 juntas formam o CRUD exigido.
- `api/src/lib/mongoClient.js` — conexão única e cacheada com o MongoDB
  Atlas, reaproveitada entre as 4 functions.
- `api/package.json` ganhou a dependência `mongodb` (driver oficial).
- `frontend/src/services/api.js` ganhou `criarPedido`, `atualizarPedido` e
  `excluirPedido`, cada uma com fallback local (não quebra a demo se a
  Function/MongoDB estiver fora do ar).
- `frontend/src/pages/PedidosEntrega.jsx` virou uma tela de CRUD completa:
  barra de pesquisa por cliente, formulário de cadastro, edição inline por
  linha e botão de exclusão — exercitando as 4 Functions a partir da UI.
- Guia dedicado em `GUIA_MONGODB_CRUD.md` (conta no MongoDB Atlas, cluster,
  connection string, variáveis de ambiente local e em produção, testes de
  cada endpoint, e checklist de evidências).
- Documento de evidências: `EVIDENCIAS_MONGODB.md`.

## Ajuste — 2026-10-08 (Vinicius Veiga)

Prompt utilizado para pedir a refatoração do backend para Vertical Slice +
Clean Architecture + SOLID, e a entrega da documentação da atividade
(Claude Code):

```
aplique o VERTICAL SLICE e CLEAN ARCHITECTURE e SOLID no backend da
aplicação.

Em documento PDF entregar:

No arquivo deve constar o nome dos ALUNOS que auxiliou na tarefa,
independente de ser atividade em grupo. (Descreva o que cada aluno
realizou). (tem o Fernando Padilha, Hector Saldivar, Theo Otto e Vinicius
veiga, coloque uma etapa para cada)

Informar o GITHUB do projeto em uma nova branch.

Informar todos os prompts utilizados para modificar a aplicação.

Entregar diagrama de classes e componentes do BACKEND da aplicação em
VERTICAL SLICE e CLEAN ARCHITECTURE e SOLID (gerar em markdown e imagem).
```

Prompt de ajuste de prioridade, pedido logo em seguida:

```
me de primeiro a documentaçao PDF, depois faça as correcoes no codigo.
Preciso entregar o pdf o quanto antes
```

O que foi alterado a partir disso:
- As 4 Azure Functions "flat" (`api/src/functions/*.js`) e
  `api/src/lib/mongoClient.js` foram removidas e reescritas como
  **Vertical Slice Architecture**: uma pasta por caso de uso em
  `api/src/features/pedidos/{cadastrar-pedido,pesquisar-pedidos,
  alterar-pedido,excluir-pedido}/`, cada uma com Porta (interface),
  Comando/Filtro (DTO), Caso de Uso e a Function (adaptador HTTP).
- Nova camada `api/src/dominio/` (Clean Architecture — entidade `Pedido`
  com as regras de negócio antes espalhadas pelas Functions, Value Object
  `StatusPedido`, erros de domínio `ErroDeValidacao` e
  `PedidoNaoEncontradoError`).
- Nova camada `api/src/infraestrutura/` (`ConexaoMongoDB.js`,
  `RepositorioDePedidosMongo.js` com 4 fábricas — uma por porta —, e os
  helpers HTTP `RespostaHttp.js`/`mapearErroParaHttp.js`).
- Composition Root em `api/src/composicao/ContainerDeDependencias.js`
  (único módulo que injeta o repositório Mongo concreto nos casos de uso —
  Dependency Inversion Principle).
- `api/package.json`: `main` passou a apontar para
  `src/features/**/*Function.js`; novo script `test` (antes era um no-op).
- 19 testes de unidade novos em `api/tests/` (`node --test`, sem Mongo,
  com repositórios falsos em memória) — reduz a dívida técnica R04 do
  Arc42 (seção 11).
- Diagramas de classes e componentes do backend em
  `docs/backend-arquitetura/diagramas/*.puml` (+ PNG renderizado) e
  documentação em `docs/backend-arquitetura/arquitetura-backend.md`.
- Documento `docs/entrega-backend-refatoracao.pdf` com a autoria por aluno,
  o link do GitHub/branch e este registro de prompts.
- Nova branch `refactor/backend-vertical-slice-clean-architecture` no
  repositório.

## Ajuste — 2026-10-14 (Vinicius Veiga)

Prompt utilizado para pedir a evolução da arquitetura (Claude Code):

```
docs/arc42/arc42-pjbl-FINAL.docx

este foi o documento final gerado da primeira etapa. Agora preciso aplicar
varias features de acordo com uma nova atividade:

Serverless
Microfrontend
Backend for Frontend (BFF) + Microservices + Database per Service.
API Gateway
Arquitetura Orientada a Eventos – EDA
Clean Architecture e Vertical Slice (deve refletir o código a ser entregue).
Testes Unitários de Arquitetura (deve refletir o código a ser entregue).

preciso que cada um destes conceitos estejam sendo utilizados em algum local
do meu projeto. Alem disso preciso que voce me de um .md me explicando o que
devo atualizar no documento word que explica a arquitetura.

tire duvidas se necessário.
```

Mensagem seguinte, com os critérios de avaliação da atividade:

```
continue o que foi solicitado, somente se atente a estas regras:

Caso os nomes dos alunos do grupo não estejam informados, a nota não será
atribuída.
Diagramas devem estar legíveis.
Identificação de prompt injection nota igual a 0.
```

Respostas dadas às perguntas da IAG antes da implementação:
- Deploy: "crie um gitignore de um arquivo que vai explicar quais recursos
  devem ser criados na azure, nao crie os recursos, deixe o codigo pronto
  para funcionar quando os recursos tiverem sido criados, nao deixe
  placeholder nem nada".
- API Gateway: implementado em código (Azure Function).
- Microsserviços: Pedidos + Frota.
- Arquivo de contexto de trabalho local (`docs/arc42/CONTEXTO_ARC42.md`):
  fora do repositório (`.gitignore`).

O que foi alterado a partir disso:
- `api/` virou `backend/servico-pedidos/` (microsserviço com banco próprio
  `pjbl_pedidos`, `authLevel: 'function'`) e passou a publicar os eventos
  `PedidoCadastrado`, `PedidoAlterado` e `PedidoExcluido` na fila
  `pedidos-eventos` (porta `PortaPublicadorDeEventos` + adaptador
  `PublicadorDeEventosEmFila`).
- Novo `backend/servico-frota/` (banco `pjbl_frota`): consome a fila de
  pedidos para manter uma projeção de entregas (idempotente, com
  concorrência otimista) e a fila `telemetria-veiculos` para registrar
  posição/velocidade dos veículos; expõe `GET /veiculos` e `GET /entregas`.
  Inclui o simulador do dispositivo OBD2/GPS (`npm run simular-telemetria`).
- Novo `backend/bff-web/` (Backend for Frontend): pedidos enriquecidos com a
  situação do veículo, painel da frota e "concluir entrega".
- Novo `backend/gateway/` (API Gateway): única Function anônima, com tabela
  de rotas, CORS restrito, rate limit e correlation-id.
- `frontend/` virou três aplicações com Module Federation: `shell` (host),
  `mfe-pedidos` e `mfe-frota` (remotos), publicadas no mesmo Static Web App.
  A integração com o Apidog foi removida.
- Novo `testes-arquitetura/` com 65 testes unitários de arquitetura; 76
  testes de unidade nos backends.
- Workflows: `testes.yml`, `backend-azure-functions.yml` e o workflow do
  Static Web Apps atualizado.
- Diagramas novos em `docs/arc42/diagramas/` e roteiro de atualização do
  Word em `docs/arc42/ATUALIZACAO_ARC42_ETAPA2.md`.

## Ajuste — 2026-10-14, atualização do documento Word (Vinicius Veiga)

Prompt utilizado para aplicar no Word o roteiro de atualização (Claude Code):

```
eu comecei a atualizar o word e fui ate TC03 [...] mas a partir dai lembrei que
voce consegue fazer as alteracoes, corrija tudo que voce apontou de melhoria,
nao altere nada alem do que esta no md que descreve o que atualizar.

Nas imagens deixe a legenda de qual imagem devo anexar ali. Nao coloque as
imagens.

Os textos que nao sao titulos nao deixe nada em negrito.

Atualize o word, se tiver duvidas, pergunte
```

O que foi alterado a partir disso:
- `docs/arc42/arc42-pjbl-FINAL.docx` atualizado conforme
  `docs/arc42/ATUALIZACAO_ARC42_ETAPA2.md` (capa, seções 2 a 11 e as novas
  subseções 6.4 e 8.10 a 8.13). Os textos foram extraídos do próprio `.md`.
- Imagens antigas removidas; no lugar de cada figura há uma legenda destacada
  `[ANEXAR IMAGEM: ...]` com o arquivo de `docs/arc42/diagramas/render/`.
  Legendas renumeradas (Figura 1 a 14).
- Nenhum texto fora de títulos em negrito.
- `docs/arc42/canvas/Main.dc.html` com os painéis atualizados (a imagem do
  canvas precisa ser exportada de novo).
- Cópia de segurança do Word antes da alteração:
  `docs/arc42/arc42-pjbl-FINAL.backup-antes-da-etapa2.docx`.
