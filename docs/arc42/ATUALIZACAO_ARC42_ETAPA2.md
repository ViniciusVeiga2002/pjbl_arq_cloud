# Atualização do Arc42 — Etapa 2

Roteiro de alterações no documento `docs/arc42/arc42-pjbl-FINAL.docx` para
refletir a nova arquitetura, organizado seção por seção na mesma ordem do
Word. Os textos entre blocos de citação (`>`) já estão prontos para colar.

**Grupo:** Fernando Padilha, Hector Saldivar, Theo Otto, Vinicius Veiga.

---

## 0. O que mudou e onde cada conceito está no código

| Conceito exigido | Onde está no código | Onde entra no Arc42 |
|---|---|---|
| **Serverless** | Os 4 backends são Azure Functions no plano de Consumo (`backend/*/host.json`, `app.http`/`app.storageQueue`); frontend no Static Web Apps | 2, 4, 7, ADR-02 |
| **Microfrontend** | `frontend/shell` (host) + `frontend/mfe-pedidos` e `frontend/mfe-frota` (remotos), Module Federation (`vite.config.js` de cada um) | 4, 5.1, 5.3.3, ADR-08 |
| **BFF** | `backend/bff-web` — compõe pedidos + veículos, monta o painel, orquestra "concluir entrega" | 4, 5.1, 5.2, ADR-10 |
| **Microsserviços** | `backend/servico-pedidos` e `backend/servico-frota`, cada um com `package.json`, `host.json` e deploy próprios | 4, 5.1, 5.2, ADR-11 |
| **Database per Service** | `pjbl_pedidos` (só o serviço de pedidos) e `pjbl_frota` (só o de frota), usuários do Atlas separados | 5.1, 8.1, ADR-11 |
| **API Gateway** | `backend/gateway` — única Function anônima: rotas, CORS restrito, rate limit, correlation-id | 4, 5.1, 5.2, 8.5, ADR-09 |
| **EDA** | Fila `pedidos-eventos` (PedidoCadastrado/Alterado/Excluido) e fila `telemetria-veiculos`; consumidores com Queue Trigger no serviço de frota | 4, 6, 8.12, ADR-12 |
| **Clean Architecture** | Em todos os backends: `dominio/` · `aplicacao/` · `features/` · `infraestrutura/` · `composicao/` | 5.2, 5.3, 8.10, ADR-13 |
| **Vertical Slice** | `features/<área>/<fatia>/` com `*Function.js` + `*CasoDeUso.js` + `Porta*` + `Comando`/`Filtro` | 5.2, 8.10, ADR-13 |
| **Testes Unitários de Arquitetura** | `testes-arquitetura/*.test.js` (65 regras) + 76 testes de unidade em `backend/*/tests` | 8.11, 10, ADR-14 |

---

## 1. Checklist geral do Word

1. **Capa**: manter os nomes dos quatro integrantes (já estão) e trocar a
   linha "Entrega" pelo texto da seção 2 abaixo.
2. **Figuras**: substituir todas as imagens pelas novas em
   `docs/arc42/diagramas/render/` (tabela na seção 15 deste roteiro).
3. **Imagens largas** (as 3 de sequência e a de classes do serviço de
   pedidos): colocar cada uma numa seção em **paisagem** — Layout →
   Quebras → *Próxima página* antes e depois, e Orientação → *Paisagem* só
   nessa seção. Ajustar a imagem à largura da página. As demais cabem em
   retrato com 16 cm de largura.
4. **Sumário**: no final, clicar com o botão direito no sumário →
   *Atualizar campo* → *Atualizar o índice inteiro* (novas subseções 5.3.3,
   6.4, 8.10–8.13).
5. **Legendas**: renumerar as figuras (Referências → *Atualizar tabela*, ou
   F9 com tudo selecionado).

---

## 2. Capa / dados da entrega

Substituir a linha "Entrega: …" por:

> **Entrega:** Etapa 2 — evolução da arquitetura para Serverless,
> Microfrontends, Backend for Frontend, Microsserviços com Database per
> Service, API Gateway, Arquitetura Orientada a Eventos, Clean Architecture
> com Vertical Slice e Testes Unitários de Arquitetura. Documentação Arc42
> (11 seções), C4 Model (níveis 1 a 4), UML, DER e Software Architecture
> Canvas.

Acrescentar uma linha com a branch:

> **Branch desta etapa:** `refactor/backend-vertical-slice-clean-architecture`

---

## 3. Seção 1 — Introdução e Objetivos

### Texto de abertura (2º parágrafo)

Substituir "Esta documentação descreve a arquitetura-alvo do produto (seções
1–4) e detalha em profundidade a fatia já implementada (seções 5–7)…" por:

> Esta documentação descreve a arquitetura-alvo do produto (seções 1–4) e
> detalha em profundidade o que já está implementado (seções 5–8): um
> dashboard web composto por microfrontends, que acessa o sistema
> exclusivamente por um API Gateway; um Backend for Frontend que compõe dois
> microsserviços serverless — Pedidos e Frota —, cada um com o seu próprio
> banco de dados; e a colaboração entre os microsserviços por eventos em
> filas do Azure.

### 1.1 Visão Geral dos Requisitos — tabela

Alterar só a coluna "Situação nesta entrega":

| Req. | Nova situação |
|---|---|
| RF01 | Parcial (leituras simuladas por `scripts/simular-telemetria.js`, publicadas em fila) |
| RF02 | Parcial (posição GPS recebida pela fila `telemetria-veiculos`; origem simulada) |
| RF06 | Implementado (posição e velocidade reais recebidas por telemetria; mapa gráfico ainda em forma de tabela) |
| RF07 | Implementado (pedidos por entrega + situação consolidada da entrega no serviço de frota) |
| RF08 | Implementado (regra de excesso de velocidade > 80 km/h no domínio `Veiculo`) |

As demais linhas continuam como estão.

### 1.2 Objetivos de Qualidade — tabela

Alterar Q3 e Q5 e acrescentar Q6:

| # | Objetivo | Motivação |
|---|---|---|
| Q3 | Manutenibilidade / simplicidade | Time de 4 pessoas: cada mudança afeta uma fatia de um serviço; as regras de arquitetura são verificadas automaticamente por testes a cada push. |
| Q5 | Segurança | Ainda sem autenticação de usuário, mas os microsserviços já não são públicos (exigem chave) e o CORS aceita só a origem do frontend. Antes de dados reais, entra o controle de acesso por perfil (RF14). |
| Q6 | Implantação e evolução independentes | Cada microfrontend e cada microsserviço é compilado, testado e publicado separadamente; uma falha em um não derruba os outros. |

### 1.3 Partes Interessadas

Na linha "Equipe de desenvolvimento", trocar a expectativa por:

> Arquitetura que permita dividir o trabalho por microfrontend e por
> microsserviço, com regras de dependência verificadas por testes; deploy
> automatizado e independente.

### 1.4 Software Architecture Canvas — tabela

Substituir o conteúdo destas linhas:

| Bloco | Novo conteúdo |
|---|---|
| Restrições | Planos gratuitos (Azure SWA Free, Functions plano de Consumo, Atlas M0); backend 100% serverless em Azure Functions Node.js 22; frontend React/Vite com Module Federation; sem autenticação de usuário nesta fase; diagramas em PlantUML/C4. |
| Princípios e decisões-chave | Microfrontends (shell + remotos); API Gateway como única porta pública; BFF por tipo de cliente; microsserviços com Database per Service; colaboração entre serviços por eventos (Azure Queue Storage); Clean Architecture + Vertical Slice em todo backend; regras de arquitetura verificadas por testes no CI. Ver ADRs na seção 9. |
| Blocos principais | Shell, mfe-pedidos e mfe-frota (Static Web Apps) · API Gateway · BFF Web · Serviço de Pedidos · Serviço de Frota · filas `pedidos-eventos` e `telemetria-veiculos` · bancos `pjbl_pedidos` e `pjbl_frota`. Planejados: App do Motorista e BFF Mobile. |
| Dados | Pedido (banco `pjbl_pedidos`, dono: Serviço de Pedidos); Veículo e Entrega (banco `pjbl_frota`, dono: Serviço de Frota). A entrega é uma projeção mantida pelos eventos de pedido. Ver DER, seção 8. |
| Riscos e dívida | Sem autenticação de usuário; publicação de eventos sem *outbox*; consistência eventual entre serviços; *cold start* em cadeia (gateway → BFF → serviço); rate limit por instância. Ver seção 11. |

---

## 4. Seção 2 — Restrições da Arquitetura

### 2.1 Restrições Técnicas — tabela

Substituir TC01, TC02, TC03 e TC05 e acrescentar TC07 e TC08:

| # | Restrição | Consequência |
|---|---|---|
| TC01 | Hospedagem sem servidor dedicado — Azure Static Web Apps (Free) para o frontend e Azure Functions no plano de Consumo para o backend | Frontend estático; cada backend é um Function App próprio, com escala automática e cobrança por execução. |
| TC02 | Backend em Azure Functions, Node.js 22, modelo de programação v4, em **4 Function Apps independentes** (gateway, BFF, pedidos, frota) | Funções registradas por `app.http()` (HTTP) e `app.storageQueue()` (fila); cada projeto tem `package.json` e `host.json` próprios. |
| TC03 | MongoDB Atlas cluster M0 com **um banco por microsserviço** (`pjbl_pedidos`, `pjbl_frota`) e um usuário por serviço | ~512 MB no total; sem Private Endpoint no free tier; isolamento garantido pelas permissões dos usuários. |
| TC05 | Sem autenticação de usuário nesta fase | Só o API Gateway é anônimo; BFF e microsserviços exigem a chave da Function (`authLevel: 'function'`); CORS restrito às origens do frontend. |
| TC07 | Mensageria com Azure Queue Storage | Entrega "pelo menos uma vez", sem ordem garantida: os consumidores precisam ser idempotentes e tolerar eventos fora de ordem. |
| TC08 | Microfrontends com Module Federation (`@module-federation/vite`) | Shell e remotos compartilham React como singleton; remotos são publicados em subpastas do mesmo Static Web App. |

### 2.2 Restrições Organizacionais

Substituir OC04 por:

> OC04 — As atividades anteriores (microfrontend + Function mock; CRUD com
> MongoDB; refatoração para Vertical Slice + Clean Architecture) já foram
> entregues. Esta etapa evolui o mesmo sistema para microsserviços,
> microfrontends e eventos, mantendo o contrato das telas.

### 2.3 Convenções

Acrescentar:

> CV05 — Todo backend segue a mesma estrutura: `dominio/`, `aplicacao/`,
> `features/<área>/<fatia>/` (com `*Function.js`, `*CasoDeUso.js`, `Porta*`
> e `Comando`/`Filtro`), `infraestrutura/` e `composicao/`. As regras de
> dependência entre essas pastas são verificadas pelos testes de
> arquitetura.

---

## 5. Seção 3 — Contexto e Escopo

### 3.1 Contexto de Negócio

- **Figura 1** → substituir por `render/c4-nivel1-contexto.png`.
- Na tabela, linha "Dispositivo OBD2 do veículo (planejado)":
  - Nome: **Dispositivo OBD2/GPS do veículo (simulado)**
  - Entradas: *Leituras de telemetria: placa, posição GPS e velocidade*
  - Saídas: *— (comunicação assíncrona por fila, sem resposta)*

### 3.2 Contexto Técnico — tabela

Substituir a tabela inteira por:

| Canal | Tecnologia / Protocolo | Entrada/Saída transportada |
|---|---|---|
| Navegador ↔ Azure Static Web Apps | HTTPS | Shell (HTML/JS/CSS) e `remoteEntry.js` de cada microfrontend |
| Microfrontends ↔ API Gateway | HTTPS + JSON, `/api/web/*` | Todas as requisições de dados das telas |
| API Gateway ↔ BFF Web | HTTPS + `x-functions-key` + `x-correlation-id` | Requisições encaminhadas |
| BFF Web ↔ Serviço de Pedidos / Serviço de Frota | HTTPS + `x-functions-key` | CRUD de pedidos; veículos e entregas |
| Serviço de Pedidos → fila `pedidos-eventos` | Azure Queue Storage (HTTPS) | Eventos PedidoCadastrado / Alterado / Excluido |
| Dispositivo OBD2/GPS → fila `telemetria-veiculos` | Azure Queue Storage (HTTPS) | Evento LeituraDeTelemetriaRecebida |
| Filas → Serviço de Frota | Queue Trigger do Azure Functions | Mesmos eventos, consumidos de forma assíncrona |
| Microsserviços ↔ MongoDB Atlas | MongoDB Wire Protocol sobre TLS | Documentos de cada banco (um banco por serviço) |
| GitHub ↔ Azure | HTTPS (GitHub Actions) | Build e deploy do frontend e dos 4 Function Apps |
| App mobile ↔ API Gateway (planejado) | HTTPS/JSON, `/api/mobile/*` → BFF Mobile | Entregas do dia + POD |

Parágrafo abaixo da tabela, substituir por:

> As entradas e saídas do Coordenador trafegam pelos canais Navegador ↔
> Static Web Apps e Microfrontends ↔ API Gateway; a telemetria do veículo
> entra pela fila `telemetria-veiculos`. Nenhum microsserviço é acessível
> diretamente pelo navegador.

---

## 6. Seção 4 — Estratégia de Solução

Substituir a tabela inteira por:

| Objetivo / requisito dirigente | Abordagem arquitetural | Detalhe na solução |
|---|---|---|
| Custo zero (Q2) | **Serverless** + planos gratuitos | 4 Function Apps no plano de Consumo + Static Web Apps Free + Atlas M0 + Queue Storage |
| Evolução independente das telas (Q6) | **Microfrontends** com Module Federation | Shell (host) carrega `mfe-pedidos` e `mfe-frota` em tempo de execução; cada um com build próprio |
| Uma única porta de entrada (Q5) | **API Gateway** | Function anônima com tabela de rotas, CORS restrito, rate limit e correlation-id |
| Telas simples, sem lógica de integração (Q3) | **Backend for Frontend** | BFF Web junta pedidos + situação do veículo e monta o painel da frota numa só chamada |
| Escalar e implantar partes separadamente (Q6) | **Microsserviços** | Serviço de Pedidos e Serviço de Frota, cada um num Function App |
| Autonomia de dados (Q4) | **Database per Service** | `pjbl_pedidos` e `pjbl_frota`, com usuário próprio por serviço |
| Desacoplamento temporal entre serviços (Q1, Q4) | **Arquitetura Orientada a Eventos** | Pedidos publica eventos; Frota consome e mantém a sua projeção de entregas; telemetria entra por fila |
| Regras de negócio protegidas de frameworks (Q3, Q4) | **Clean Architecture** + **Vertical Slice** | Domínio sem bibliotecas; uma fatia por caso de uso; Composition Root injeta os adaptadores |
| Arquitetura que não se degrada com o tempo (Q3) | **Testes Unitários de Arquitetura** | 65 regras verificadas no código a cada push, antes de qualquer deploy |
| Disponibilidade com rede instável (Q1) | Degradação graciosa em camadas | MFE com modo offline visível; BFF devolve pedidos mesmo sem o serviço de frota; filas com retentativa |

---

## 7. Seção 5 — Visão de Blocos de Construção

### 5.1 Nível 1 — Sistema (caixa-branca) = C4 Nível 2

- **Figura 2** → `render/c4-nivel2-conteineres.png`.
- Parágrafo "Motivação da decomposição", substituir por:

> **Motivação da decomposição:** o frontend é dividido por tela em
> microfrontends independentes, integrados pelo shell; o acesso ao backend
> passa sempre pelo API Gateway e pelo BFF, que isolam as telas da forma
> como os serviços estão organizados; o domínio é dividido em dois
> microsserviços — Pedidos e Frota — com bancos separados, que colaboram
> por eventos em vez de chamadas diretas.

- Tabela "Blocos contidos (caixa-preta)" — substituir por:

| Bloco | Responsabilidade |
|---|---|
| Shell (React 19 + Vite + Module Federation) | Layout, abas, carregamento dos microfrontends em tempo de execução e isolamento de falhas entre eles. |
| mfe-pedidos (remoto) | Tela Pedidos por Entrega: CRUD, pesquisa e conclusão de entrega. |
| mfe-frota (remoto) | Tela Mapa da Frota: indicadores, veículos e entregas, atualizada a cada 15 s. |
| API Gateway (Azure Function) | Única porta pública: roteamento por prefixo para o BFF, CORS restrito, rate limit (120 req/min por IP), correlation-id. |
| BFF Web (Azure Function) | Adapta os microsserviços às telas: pedidos com a situação do veículo, painel da frota, conclusão de entrega. Sem banco. |
| Serviço de Pedidos (Azure Functions) | CRUD de pedidos; dono do banco `pjbl_pedidos`; publica eventos de pedido. |
| Serviço de Frota (Azure Functions) | Veículos (telemetria) e projeção de entregas; dono do banco `pjbl_frota`; consome as filas. |
| Filas `pedidos-eventos` e `telemetria-veiculos` (Azure Queue Storage) | Transporte assíncrono dos eventos. |
| Bancos `pjbl_pedidos` e `pjbl_frota` (MongoDB Atlas) | Persistência, cada um acessível só pelo seu serviço. |
| App do Motorista + BFF Mobile (planejados) | Entregas do dia e POD, entrando pelo gateway em `/api/mobile/*`. |

- Tabela "Interface importante — REST /api/pedidos": trocar o título para
  **Interface importante — API pública (API Gateway)** e a tabela por:

| Método | Rota pública | Atendida por | Sucesso | Erros |
|---|---|---|---|---|
| GET | `/api/web/pedidos?cliente=&status=&entregaId=&id=` | BFF → Serviço de Pedidos + Serviço de Frota | 200 [pedido + `veiculo`] | 429, 502, 504 |
| POST | `/api/web/pedidos` | BFF → Serviço de Pedidos | 201 pedido | 400, 429, 502 |
| PUT | `/api/web/pedidos/{id}` | BFF → Serviço de Pedidos | 200 pedido | 400, 404, 429, 502 |
| DELETE | `/api/web/pedidos/{id}` | BFF → Serviço de Pedidos | 200 `{ sucesso, id }` | 404, 429, 502 |
| POST | `/api/web/entregas/{id}/concluir` | BFF → Serviço de Pedidos (vários PUT) | 200 `{ entregaId, pedidosConcluidos }` | 429, 502 |
| GET | `/api/web/painel-frota` | BFF → Serviço de Frota | 200 `{ indicadores, veiculos, entregas }` | 429, 502, 504 |

- Frase abaixo da tabela, substituir por:

> Toda resposta do gateway traz `x-correlation-id` e `x-ratelimit-remaining`;
> o CORS só é liberado para a origem do Static Web App. Rota desconhecida →
> 404; método não permitido → 405; limite excedido → 429 com `Retry-After`.

### 5.2 Nível 2 — caixa-branca dos contêineres = C4 Nível 3

- Trocar o título para **5.2. Nível 2 — Contêineres de backend
  (caixa-branca) = C4 Nível 3 (Componentes)**.
- **Figura 3** → substituir por **três** figuras, nesta ordem:
  `render/c4-nivel3-gateway-bff.png`,
  `render/c4-nivel3-servico-pedidos.png`,
  `render/c4-nivel3-servico-frota.png`.
- Tabela de componentes (a que listava `searchPedidos`, `createPedido`… e
  `mongoClient`) — substituir por:

| Contêiner | Fatia vertical (`features/…`) | Entrada | Responsabilidade |
|---|---|---|---|
| API Gateway | `roteamento/encaminhar-requisicao` | HTTP `/api/{*caminho}` (anônima) | Resolve a rota, aplica limite e encaminha ao BFF com a chave |
| BFF Web | `pedidos/pesquisar-pedidos` | HTTP GET | Pedidos + situação do veículo (degrada sem o serviço de frota) |
| BFF Web | `pedidos/cadastrar-pedido`, `alterar-pedido`, `excluir-pedido` | HTTP POST/PUT/DELETE | Repassa ao Serviço de Pedidos |
| BFF Web | `pedidos/concluir-entrega` | HTTP POST | Busca os pedidos da entrega e marca os pendentes como Entregue |
| BFF Web | `painel/obter-painel-frota` | HTTP GET | Veículos + entregas + indicadores |
| Serviço de Pedidos | `pedidos/cadastrar-pedido`, `alterar-pedido`, `excluir-pedido` | HTTP | Regra de negócio no domínio, grava e publica o evento |
| Serviço de Pedidos | `pedidos/pesquisar-pedidos` | HTTP GET | Consulta com filtros |
| Serviço de Frota | `veiculos/registrar-telemetria` | Fila `telemetria-veiculos` | Calcula o status do veículo e grava a última leitura |
| Serviço de Frota | `entregas/atualizar-projecao-de-entrega` | Fila `pedidos-eventos` | Aplica o evento à entrega (idempotente, concorrência otimista) |
| Serviço de Frota | `veiculos/listar-veiculos`, `entregas/listar-entregas` | HTTP GET | Leituras para o BFF |

Parágrafo a acrescentar abaixo da tabela:

> Cada fatia contém o seu adaptador de entrada (`*Function.js`), o caso de
> uso (`*CasoDeUso.js`), a porta (interface) de que precisa e o
> comando/filtro de entrada. As fatias não se conhecem entre si; o que elas
> compartilham fica em `dominio/` e `aplicacao/`, e só o Composition Root
> (`composicao/ContainerDeDependencias.js`) conhece as implementações de
> MongoDB, fila e HTTP.

### 5.3 Nível 3 — Detalhes

#### 5.3.1 Modelo de classes do domínio

- **Figura 4** → substituir por **duas** figuras:
  `render/uml-classes-servico-pedidos.png` e
  `render/uml-classes-servico-frota.png`.
- Substituir os dois parágrafos por:

> O domínio está dividido entre os dois microsserviços e **não há
> associação entre classes de serviços diferentes**: a única ligação é o
> contrato do evento (`EventoDePedido`), publicado pelo Serviço de Pedidos e
> interpretado pelo Serviço de Frota em `Entrega.aplicar()`.
>
> No Serviço de Pedidos, `Pedido` concentra as regras de cadastro e de
> atualização parcial, `StatusPedido` é o conjunto fechado de status e
> `EventosDePedido` monta os eventos com envelope versionado
> (`tipo`, `versao`, `ocorridoEm`, `dados`). No Serviço de Frota, `Veiculo`
> calcula o status a partir da velocidade (alerta acima de 80 km/h — RF08) e
> `Entrega` é uma projeção que guarda, para cada pedido, o último estado
> conhecido e a data do último evento aplicado, ignorando eventos antigos e
> mantendo "lápides" de pedidos excluídos. O campo `versao` sustenta o
> controle de concorrência otimista.

#### 5.3.2 → renomear para "Componentes do frontend em microfrontends"

- **Figura 5** → `render/uml-componentes-frontend.png`.
- Substituir o parágrafo por:

> O shell (host) contém apenas o layout, o registro dos microfrontends
> (`microfrontends.js`) e um limite de falha por microfrontend. Cada remoto
> expõe uma tela pelo seu `remoteEntry.js` (`mfePedidos/TelaPedidos`,
> `mfeFrota/TelaFrota`), que o shell importa em tempo de execução. Cada
> microfrontend tem a sua própria camada `services/`, a única que faz
> chamadas HTTP, sempre para o API Gateway. React é compartilhado como
> singleton. A comunicação entre microfrontends usa um evento de navegador
> combinado (`pjbl:entrega-concluida`), sem importação de código.

#### 5.4 Relação com o modelo de dados

Substituir o texto por:

> Cada microsserviço tem o seu banco; as estruturas persistidas e a forma
> como os dados de pedido chegam ao banco de frota (por eventos) estão no
> DER da seção 8.1.

---

## 8. Seção 6 — Visão de Tempo de Execução

### 6.1 Cenário 1 — Coordenador cadastra um pedido

- **Figura 6** → `render/uml-sequencia-cadastrar-pedido.png` (em página
  paisagem).
- Substituir os "Aspectos notáveis" por:

> - A requisição atravessa três Function Apps: Gateway (CORS, limite,
>   correlation-id) → BFF → Serviço de Pedidos. O mesmo `x-correlation-id`
>   aparece nos logs dos três.
> - A validação de negócio acontece no domínio (`Pedido.criar`); um erro de
>   validação vira 400 no serviço e é repassado sem alteração pelo BFF e
>   pelo gateway até a tela.
> - Depois de gravar, o caso de uso publica `PedidoCadastrado` na fila. A
>   resposta 201 não espera o Serviço de Frota: a atualização da entrega
>   acontece de forma assíncrona (consistência eventual).
> - A publicação é de "melhor esforço": se a fila falhar, o pedido já foi
>   gravado e a falha fica registrada em log (ver risco R11).

### 6.2 Cenário 2 — substituir "Carregar/pesquisar com fallback" por "Concluir entrega"

- Novo título: **6.2. Cenário 2 — Concluir entrega (eventos em paralelo)**
- **Figura 7** → `render/uml-sequencia-concluir-entrega.png` (paisagem).
- Aspectos notáveis:

> - A tela fala em "entrega"; o Serviço de Pedidos só conhece "pedido". O
>   BFF faz a tradução: busca os pedidos da entrega e envia, em paralelo, um
>   PUT para cada pedido pendente.
> - Cada PUT gera um `PedidoAlterado`. O Queue Trigger processa as mensagens
>   em lote, então dois eventos da mesma entrega podem ser aplicados ao
>   mesmo tempo.
> - O repositório só grava a entrega se a versão no banco ainda for a lida;
>   no conflito, o caso de uso relê e reaplica o evento (até 5 tentativas).
>   Sem isso, uma atualização se perderia e a entrega ficaria como "1 de 2
>   entregues" — situação reproduzida e corrigida durante o desenvolvimento.
> - O mfe-pedidos dispara `pjbl:entrega-concluida`; o shell mostra o aviso
>   sem conhecer o código do microfrontend.

### 6.3 Cenário 3 — substituir "cold start" por "Telemetria até o painel"

- Novo título: **6.3. Cenário 3 — Telemetria OBD2/GPS até o painel da frota**
- Nova figura: `render/uml-sequencia-telemetria.png` (paisagem).
- Aspectos notáveis:

> - O dispositivo (hoje o simulador) só publica a leitura na fila e segue em
>   frente; o Serviço de Frota processa no seu ritmo.
> - O domínio `Veiculo` calcula o status (parado, normal ou excesso de
>   velocidade). Mensagem inválida é descartada com log; falha de
>   infraestrutura faz a mensagem voltar à fila — após 5 tentativas, vai
>   para `telemetria-veiculos-poison`.
> - O mfe-frota consulta o painel a cada 15 s; o BFF busca veículos e
>   entregas em paralelo e calcula os indicadores.

### 6.4 (nova) Primeira invocação (*cold start*) e modo offline

> Cada Function App mantém em cache, por instância, a conexão com o MongoDB
> (serviços) ou o cliente da fila, como na etapa anterior. Como uma
> requisição atravessa três Function Apps, o *cold start* pode se somar na
> primeira chamada após ociosidade (risco R10). Se o gateway não responder,
> cada microfrontend usa dados locais e exibe o aviso "Modo offline" — a
> indisponibilidade deixa de ser silenciosa.

---

## 9. Seção 7 — Visão de Implantação

- **Figura 8** → `render/deployment.png`.
- Tabela de nós — substituir por:

| Nó | Ambiente de execução | Artefato(s) |
|---|---|---|
| Estação do usuário | Navegador | Shell + microfrontends carregados em tempo de execução |
| Azure Static Web Apps (Free) | Hospedagem estática gerenciada | `frontend/dist`: shell na raiz, `/mfe-pedidos/`, `/mfe-frota/` |
| Function App `pjbl-arq-cloud-gateway` | Azure Functions, plano de Consumo, Node.js 22 | `backend/gateway` |
| Function App `pjbl-arq-cloud-bff-web` | idem | `backend/bff-web` |
| Function App `pjbl-arq-cloud-pedidos` | idem | `backend/servico-pedidos` |
| Function App `pjbl-arq-cloud-frota` | idem | `backend/servico-frota` |
| Storage Account `pjblarqcloudeventos` | Azure Queue Storage | Filas `pedidos-eventos` e `telemetria-veiculos` |
| MongoDB Atlas (M0) | Cluster gerenciado | Bancos `pjbl_pedidos` e `pjbl_frota`, um usuário por serviço |
| GitHub Actions | Runner ubuntu-latest | Testes, build e deploy (não hospeda a aplicação) |

- Pipeline CI/CD — substituir a lista numerada por:

> 1. Push em qualquer branch ou PR: workflow **Testes** — 76 testes de
>    unidade, 65 testes de arquitetura e build dos três microfrontends.
> 2. Push na `main` com mudanças em `backend/`: workflow **Deploy do
>    backend** — roda os testes e, se passarem, publica os 4 Function Apps
>    em paralelo (um job por serviço, `Azure/functions-action`).
> 3. Push na `main`: workflow **Deploy do frontend** — roda os testes,
>    compila shell e remotos separadamente, monta `frontend/dist` e publica
>    no Static Web App (`skip_app_build`).
> 4. Nenhum deploy acontece se uma regra de arquitetura for violada.

---

## 10. Seção 8 — Conceitos Transversais

### 8.1 Modelo de dados

- **Figura 9** → `render/der-database-per-service.png`.
- Substituir os parágrafos por:

> O modelo é dividido por dono (Database per Service). O banco
> `pjbl_pedidos` tem a coleção `pedidos`, acessível só pelo Serviço de
> Pedidos. O banco `pjbl_frota` tem `veiculos` (última leitura por placa,
> índice único) e `entregas` (projeção com os pedidos embutidos e o campo
> `versao`), acessíveis só pelo Serviço de Frota.
>
> **Não existe chave estrangeira entre bancos.** A relação pedido ↔
> entrega é mantida por eventos: o Serviço de Frota guarda, para cada
> pedido, apenas o que precisa (id, status, previsão e data do último
> evento). O nome do cliente não é enviado nos eventos: o Serviço de Frota
> não precisa dele.

- Na tabela "Documento pedido", alterar a origem de `id` e `criadoEm` de
  "servidor (createPedido)" para **"domínio (Pedido.criar)"**, e de
  `atualizadoEm` para **"domínio (Pedido.construirAtualizacaoParcial)"**.

### 8.2 Configuração e segredos — substituir por

> Configuração exclusivamente por variáveis de ambiente, separadas por
> Function App: `MONGODB_URI`, `MONGODB_DB` e `EVENTOS_STORAGE` nos
> microsserviços; `SERVICO_PEDIDOS_URL/CHAVE` e `SERVICO_FROTA_URL/CHAVE` no
> BFF; `BFF_WEB_URL/CHAVE`, `ORIGENS_PERMITIDAS` e
> `LIMITE_REQUISICOES_POR_MINUTO` no gateway. Localmente vêm de
> `local.settings.json` (fora do Git); no Azure, dos *Application settings*.
> No frontend há uma única variável, `VITE_GATEWAY_URL`, pública e embutida
> no build (`.env.development` / `.env.production` de cada microfrontend).

### 8.3 Persistência em ambiente serverless — substituir por

> Cada microsserviço mantém o seu próprio cache da conexão com o MongoDB
> por instância do Function App. O Serviço de Frota cria, uma vez por
> instância, os índices únicos de `veiculos.placa` e `entregas.id`, que
> sustentam o *upsert* de veículos e o controle de concorrência das
> entregas.

### 8.4 Tratamento de erros — substituir por

> - **Microsserviços:** erro de domínio → 400/404 com `{ erro }`; falha de
>   infraestrutura → 500.
> - **BFF:** repassa 4xx do serviço sem alteração (erro do usuário);
>   converte 5xx/indisponibilidade em 502 e timeout (8 s) em 504.
> - **Gateway:** 404 (rota), 405 (método), 429 (limite), 502/504 (BFF
>   indisponível ou lento).
> - **Consumidores de fila:** mensagem inválida é descartada com log;
>   falha de infraestrutura é relançada para a fila reentregar (até 5
>   vezes; depois, fila `-poison`).

### 8.5 CORS — substituir por

> O CORS é tratado **somente no API Gateway**, a única Function chamada pelo
> navegador. Em vez de `*`, são aceitas apenas as origens do Static Web App
> e dos servidores locais do Vite. BFF e microsserviços não enviam
> cabeçalhos CORS.

### 8.6 Autenticação e autorização — substituir por

> Ainda não há identidade de usuário (RF14 planejado). Já existe, porém,
> autenticação **entre serviços**: o gateway é anônimo, mas o BFF e os
> microsserviços usam `authLevel: 'function'` e só respondem a quem envia a
> chave (`x-functions-key`) — o gateway tem a chave do BFF e o BFF tem as
> dos serviços. O caminho previsto para RF14 é validar o token do usuário no
> gateway e repassar os papéis ao BFF.

### 8.7 Resiliência — substituir por

> Resiliência em camadas: (1) o shell isola falhas — se um microfrontend não
> carregar, só a área dele mostra o aviso; (2) cada microfrontend tem modo
> offline com aviso visível; (3) o BFF devolve os pedidos mesmo com o
> Serviço de Frota fora do ar (`veiculo: null`); (4) gateway e BFF usam
> timeout; (5) as filas desacoplam os serviços no tempo e reentregam
> mensagens; (6) o consumidor é idempotente e trata eventos fora de ordem e
> concorrentes.

### 8.9 Build e entrega contínua — substituir por

> Cada parte é compilada e publicada de forma independente: 3 builds de
> frontend e 4 deploys de Function App. Testes de unidade e de arquitetura
> são pré-requisito de todos os deploys (detalhes na seção 7).

### 8.10 (nova) Clean Architecture e Vertical Slice

> Todos os backends seguem a mesma organização. A **Regra de Dependência**
> da Clean Architecture aponta sempre para dentro: adaptadores de entrada
> (`*Function.js`) → aplicação (casos de uso, portas, comandos) → domínio
> (sem bibliotecas). A infraestrutura (MongoDB, fila, clientes HTTP)
> implementa as portas e só é conhecida pelo Composition Root, que injeta os
> adaptadores nos casos de uso (Inversão de Dependência).
>
> Por cima disso, o código é organizado em **fatias verticais**: uma pasta
> por caso de uso em `features/<área>/<fatia>/`, com tudo o que ele
> precisa. Uma fatia nunca importa outra; o que é compartilhado vive em
> `dominio/` e `aplicacao/`. Adicionar um caso de uso é criar uma fatia
> nova, sem tocar nas existentes.

### 8.11 (nova) Testes Unitários de Arquitetura

- Inserir a figura `render/regras-de-arquitetura.png`.
- Texto:

> As decisões de arquitetura são verificadas **no código real** por testes
> automatizados, no estilo do ArchUnit, escritos com o executor nativo do
> Node (`node:test`) e sem dependências externas
> (`testes-arquitetura/`). Um utilitário lê os `require`/`import` de cada
> arquivo e monta o grafo de dependências; cada regra percorre o grafo e
> falha listando as violações encontradas. São 65 verificações:
>
> | Arquivo | O que garante |
> |---|---|
> | `backend-clean-architecture.test.js` | Domínio sem bibliotecas nem outras camadas; aplicação só depende de aplicação e domínio; `mongodb`/`storage-queue` só na infraestrutura e `@azure/functions` só nos adaptadores de entrada; só o Composition Root conhece adaptadores de saída; Functions não instanciam casos de uso |
> | `backend-vertical-slice.test.js` | Fatias existentes = fatias documentadas; cada fatia tem 1 `*Function.js` e 1 `*CasoDeUso.js`; fatia não importa fatia |
> | `backend-microsservicos-bff-gateway.test.js` | Nenhum projeto importa código de outro; bancos com nomes exclusivos e nunca citados por outro serviço; BFF e gateway sem banco; microsserviços sem HTTP de saída; gateway só roteia para BFFs; só o gateway é anônimo; todo ponto de entrada é uma Azure Function |
> | `arquitetura-orientada-a-eventos.test.js` | Fila publicada = fila consumida; todo tipo de evento publicado é aceito pelo consumidor; envelope versionado; toda escrita publica evento e a leitura não; só a infraestrutura conhece a fila |
> | `frontend-microfrontends.test.js` | Shell e remotos com build próprio e Module Federation; nenhum importa código de outro; shell usa só módulos federados; remotos registrados e expostos; React singleton; `fetch` só em `services/`; microfrontends só chamam o gateway; CSS com escopo |
>
> Para garantir que as regras realmente detectam problemas, foram
> injetadas violações de propósito (domínio importando `mongodb`, fatia
> importando fatia, serviço citando o banco do outro, serviço chamando
> outro por HTTP, Function instanciando caso de uso, microfrontend
> importando outro, tela chamando microsserviço direto) — cada uma foi
> apontada pela regra correspondente. Os testes rodam no CI antes de
> qualquer deploy.

### 8.12 (nova) Eventos

> Envelope de todo evento: `{ id, origem, tipo, versao, ocorridoEm, dados }`.
> `versao` é a versão do contrato; `ocorridoEm` permite ignorar eventos
> antigos. Filas: `pedidos-eventos` (PedidoCadastrado, PedidoAlterado,
> PedidoExcluido; produtor: Serviço de Pedidos) e `telemetria-veiculos`
> (LeituraDeTelemetriaRecebida; produtor: dispositivo OBD2/GPS). Consumidor
> de ambas: Serviço de Frota. Entrega "pelo menos uma vez" e sem ordem
> garantida — por isso o consumidor é idempotente, descarta eventos antigos
> e usa concorrência otimista.

### 8.13 (nova) Observabilidade

> O gateway gera (ou aceita) um `x-correlation-id`, registra cada requisição
> no log com esse identificador (Application Insights) e o devolve ao
> navegador. O mesmo cabeçalho é repassado ao BFF e, pelo BFF, aos
> microsserviços — a base para, numa próxima etapa, incluí-lo também nos
> logs desses serviços e seguir uma requisição pelos três Function Apps.

---

## 11. Seção 9 — Decisões de Arquitetura

Alterar ADR-02, ADR-05 e ADR-07 e acrescentar ADR-08 a ADR-16.

| ID | Decisão | Contexto | Consequências |
|---|---|---|---|
| ADR-02 (alterada) | Static Web Apps só para o frontend; backend em 4 Function Apps no plano de Consumo | Microsserviços precisam de deploy e escala independentes; *managed functions* do SWA permitem só um app de API | Mais recursos para administrar; *cold start* em cadeia (R10) |
| ADR-05 (alterada) | Fallback local no microfrontend, com aviso "Modo offline" visível | O fallback silencioso mascarava falhas (R05) | O usuário sabe quando os dados não são reais |
| ADR-07 (alterada) | Uma camada `services/` por microfrontend, chamando só o gateway | Cada microfrontend é autônomo | Pequena duplicação entre os `services/` (aceita, R14) |
| ADR-08 | Microfrontends com Module Federation (shell + 2 remotos), publicados no mesmo Static Web App em subpastas | Telas evoluem separadamente; URLs relativas evitam CORS e configuração por ambiente | Builds independentes; deploy hoje conjunto (um SWA); React singleton obrigatório |
| ADR-09 | API Gateway implementado em código (Azure Function) em vez de Azure API Management | Custo zero, roda localmente, regras testáveis no CI | Rate limit por instância (R13); sem portal de desenvolvedor |
| ADR-10 | Um BFF por tipo de cliente (BFF Web agora; BFF Mobile planejado) | Telas precisam de dados combinados de serviços diferentes | Lógica de composição fora das telas e dos serviços |
| ADR-11 | Dois microsserviços (Pedidos e Frota) com Database per Service | Pedidos e frota mudam por motivos diferentes; a telemetria tem volume próprio | Sem joins entre bancos; dados replicados por eventos; consistência eventual (R12) |
| ADR-12 | Colaboração por eventos em Azure Queue Storage | Barato, nativo do Functions (Queue Trigger), emulável localmente (Azurite) | Uma fila por consumidor; sem *fan-out* nativo — para vários consumidores, migrar para Service Bus Topics ou Event Grid |
| ADR-13 | Clean Architecture + Vertical Slice em todos os backends | Mesma estrutura em 4 projetos facilita a manutenção e a verificação automática | Mais arquivos por caso de uso |
| ADR-14 | Testes de arquitetura com `node:test` e um analisador de imports próprio | Sem dependências; regras específicas do projeto (bancos, filas, gateway) | O analisador cobre `require`/`import` estáticos e dinâmicos com texto literal |
| ADR-15 | Concorrência otimista (campo `versao`) na projeção de entregas | Mensagens da mesma entrega são processadas em paralelo | Retentativa no caso de uso; índice único em `entregas.id` |
| ADR-16 | Publicação de eventos "melhor esforço", sem *Transactional Outbox* | Simplicidade no escopo acadêmico | Evento pode se perder se a fila falhar logo após a gravação (R11) |

---

## 12. Seção 10 — Requisitos de Qualidade

### 10.1 Árvore de Qualidade — acrescentar linhas

| Categoria | Subcaracterística | Prioridade | Objetivo |
|---|---|---|---|
| Manutenibilidade | Modularidade verificada (testes de arquitetura) | Alta | Q3 |
| Confiabilidade | Isolamento de falhas entre partes | Alta | Q1, Q6 |
| Portabilidade | Implantação independente | Média | Q6 |

Na linha "Manutenibilidade — Testabilidade", trocar a prioridade de "Média
(dívida)" para **"Alta (141 testes automatizados)"**.

### 10.2 Cenários de Qualidade

Alterar CQ01, CQ04, CQ05 e CQ06 e acrescentar CQ07 a CQ11:

| ID | Atributo | Estímulo | Resposta esperada | Métrica |
|---|---|---|---|---|
| CQ01 | Disponibilidade | Gateway ou banco indisponível durante o uso | Telas continuam navegáveis com o aviso "Modo offline" | 0 tela de erro fatal; aviso sempre visível |
| CQ04 | Evolutibilidade | Trocar a tabela de veículos por um mapa real | Alterar só o `mfe-frota` | 0 alteração no shell, no `mfe-pedidos` e no backend |
| CQ05 | Manutenibilidade | Novo integrante precisa entender um caso de uso | Abrir uma única pasta de fatia | 1 pasta por caso de uso |
| CQ06 | Portabilidade | Trocar MongoDB ou a fila por outro serviço | Reescrever só o adaptador em `infraestrutura/` | 0 alteração em domínio e casos de uso |
| CQ07 | Isolamento de falhas | `remoteEntry.js` do `mfe-frota` indisponível | Shell e `mfe-pedidos` continuam funcionando | Falha contida na área do microfrontend |
| CQ08 | Conformidade arquitetural | Um PR faz o domínio importar `mongodb` | CI falha e o deploy não acontece | 100% dos PRs verificados |
| CQ09 | Consistência eventual | Coordenador conclui uma entrega com 3 pedidos | Painel da frota mostra "Concluída 3/3" | < 15 s; nenhuma atualização perdida |
| CQ10 | Segurança | Chamada direta a um microsserviço sem chave | Recusada | HTTP 401 |
| CQ11 | Proteção de capacidade | Mais de 120 req/min do mesmo IP | Gateway responde 429 com `Retry-After` | Nenhuma chamada excedente chega ao BFF |

---

## 13. Seção 11 — Riscos e Dívida Técnica

Alterar estas linhas:

| ID | Nova redação |
|---|---|
| R01 | **Parcialmente mitigado.** Microsserviços e BFF exigem chave e o CORS foi restrito; ainda não há autenticação de usuário (RF14). |
| R04 | **Resolvido.** 76 testes de unidade + 65 testes de arquitetura, executados no CI antes de todo deploy. |
| R05 | **Mitigado.** O modo offline agora é exibido na tela. |
| R09 | **Resolvido.** A integração com o Apidog foi removida; "concluir entrega" passou a ser atendida pelo BFF. |
| R10 | *Cold start* em cadeia: uma requisição pode acordar até 3 Function Apps (gateway → BFF → serviço). Mitigação: conexões em cache; se necessário, plano Flex Consumption com instâncias sempre prontas. |

Acrescentar:

| ID | Risco / Dívida | Impacto | Mitigação |
|---|---|---|---|
| R11 | Publicação de eventos sem *Transactional Outbox* | Pedido gravado sem evento se a fila falhar nesse instante; projeção desatualizada | Implementar outbox (coleção de eventos pendentes + publicador) |
| R12 | Consistência eventual entre serviços | O painel da frota pode refletir uma alteração alguns segundos depois | Aceito; documentado na tela ("atualiza a cada 15 s") |
| R13 | Rate limit em memória, por instância | Com várias instâncias, o limite efetivo é maior | Mover contagem para cache distribuído ou usar API Management |
| R14 | Duplicação de estilos e de lógica de fallback entre microfrontends | Mudança visual precisa ser repetida | Biblioteca de design compartilhada, versionada |
| R15 | Chaves de Function como segredo compartilhado | Chave vazada dá acesso direto a um serviço | Rotacionar chaves; evoluir para identidade gerenciada |
| R16 | A projeção de entregas não tem *replay* | Pedidos anteriores à criação do serviço de frota só aparecem quando alterados | Script de carga inicial que publica eventos para os pedidos existentes |

---

## 14. Software Architecture Canvas (imagem)

Se o Word também tiver a imagem do canvas (`01-canvas-arquitetura.jpeg`),
atualize os blocos "Princípios", "Blocos principais", "Dados" e "Riscos"
em `docs/arc42/canvas/Main.dc.html` com o mesmo texto da tabela da seção
1.4 acima e exporte a imagem de novo.

---

## 15. Figuras: antiga → nova

| Fig. | Seção | Antes | Agora (`docs/arc42/diagramas/render/`) | Página |
|---|---|---|---|---|
| 1 | 3.1 | Contexto (C4 N1) | `c4-nivel1-contexto.png` | retrato |
| 2 | 5.1 | Contêineres (C4 N2) | `c4-nivel2-conteineres.png` | retrato |
| 3 | 5.2 | Componentes da Function App | `c4-nivel3-gateway-bff.png` | retrato |
| 3b | 5.2 | — | `c4-nivel3-servico-pedidos.png` | retrato |
| 3c | 5.2 | — | `c4-nivel3-servico-frota.png` | retrato |
| 4 | 5.3.1 | Classes do domínio | `uml-classes-servico-pedidos.png` | paisagem |
| 4b | 5.3.1 | — | `uml-classes-servico-frota.png` | retrato |
| 5 | 5.3.2 | Componentes do microfrontend | `uml-componentes-frontend.png` | retrato |
| 6 | 6.1 | Sequência: cadastrar pedido | `uml-sequencia-cadastrar-pedido.png` | paisagem |
| 7 | 6.2 | Sequência: buscar com fallback | `uml-sequencia-concluir-entrega.png` | paisagem |
| 7b | 6.3 | — | `uml-sequencia-telemetria.png` | paisagem |
| 8 | 7 | Implantação | `deployment.png` | retrato |
| 9 | 8.1 | DER | `der-database-per-service.png` | retrato |
| 10 | 8.11 | — | `regras-de-arquitetura.png` | retrato |

Todas as imagens foram geradas em 180 dpi a partir dos `.puml` da mesma
pasta (comando no `diagramas/README.md`).
