# Evidências — MongoDB Atlas + 4 Azure Functions (CRUD)

## Alunos que realizaram a atividade

- Fernando Padilha
- Hector Saldivar
- Theo Otto
- Vinicius Veiga

**Disciplina:** Arquitetura de Soluções / Computação em Nuvem
**Projeto PJBL:** Plataforma de telemetria veicular (OBD2) + app mobile + dashboard de gestão de entregas para transportadoras.

Guia completo do passo a passo: `GUIA_MONGODB_CRUD.md`.

---

## 1. Evidência — Criação do banco de dados MongoDB

> Print do cluster criado no MongoDB Atlas e da coleção `pedidos` com pelo
> menos um documento (aba **Browse Collections**).

`![Banco de dados criado no MongoDB Atlas](evidencias/01-mongodb-atlas.png)`

_(Substitua o caminho acima pelo print real, salvo em `evidencias/01-mongodb-atlas.png`.)_

## 2. Evidência — Criação das 4 Azure Functions

> Print do Azure Portal mostrando as 4 Functions dentro da Function App
> vinculada ao Static Web App: `searchPedidos`, `createPedido`,
> `updatePedido`, `deletePedido`.

`![As 4 Azure Functions publicadas](evidencias/02-azure-functions.png)`

_(Substitua o caminho acima pelo print real, salvo em `evidencias/02-azure-functions.png`.)_

## 3. Evidência — Frontend executando as 4 Azure Functions

> Prints da tela "Pedidos por entrega" em produção realizando pesquisar,
> inserir, alterar e excluir — idealmente com a aba **Network** do
> DevTools do navegador mostrando as 4 chamadas (`GET`, `POST`, `PUT`,
> `DELETE`) com status de sucesso.

`![Frontend consumindo as 4 Azure Functions](evidencias/03-frontend-crud.png)`

_(Substitua o caminho acima pelo print real, salvo em `evidencias/03-frontend-crud.png`.)_

---

## Links de referência

- **Site publicado:** https://kind-water-063145a0f.7.azurestaticapps.net
- **Repositório GitHub:** https://github.com/ViniciusVeiga2002/pjbl_arq_cloud
- **Endpoint pesquisar (GET):** https://kind-water-063145a0f.7.azurestaticapps.net/api/pedidos
