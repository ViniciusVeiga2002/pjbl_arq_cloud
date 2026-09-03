# Telemetria & Gestão de Entregas — Atividade Formativa (Microfrontend + Azure Functions + MongoDB)

Frontend em React (Vite) que consome Azure Functions para exibir duas telas
do projeto PJBL de telemetria veicular: **Mapa da frota** e **Pedidos por
entrega**. A tela de pedidos é um CRUD completo (inserir, pesquisar,
alterar, excluir) persistido no **MongoDB Atlas**. Ver `GRUPO.md` para os
integrantes e `Prompt.md` para os prompts de IAG utilizados.

## Links da entrega

- **Site publicado (Azure Static Web Apps):** https://kind-water-063145a0f.7.azurestaticapps.net
- **Repositório GitHub:** https://github.com/ViniciusVeiga2002/pjbl_arq_cloud
- **Azure Function usada pelo frontend (pesquisar):** https://kind-water-063145a0f.7.azurestaticapps.net/api/pedidos
- **Mock no Apidog (mapa da frota e conclusão de entrega):** https://mock.apidog.com/m1/1368691-1373285-default

## Azure Functions do CRUD de pedidos (MongoDB Atlas)

| Operação | Método | Rota | Function |
|---|---|---|---|
| Pesquisar | `GET` | `/api/pedidos` | `searchPedidos` |
| Inserir | `POST` | `/api/pedidos` | `createPedido` |
| Alterar | `PUT` | `/api/pedidos/{id}` | `updatePedido` |
| Excluir | `DELETE` | `/api/pedidos/{id}` | `deletePedido` |

Veja `GUIA_MONGODB_CRUD.md` para o passo a passo completo (conta no MongoDB
Atlas, cluster, connection string, variáveis de ambiente e testes) e
`EVIDENCIAS_MONGODB.md` para as evidências exigidas na atividade.

## Estrutura do repositório

```
.
├── GRUPO.md                  # nome dos integrantes do grupo
├── Prompt.md                  # prompts de IAG utilizados
├── README.md                   # este arquivo
├── GUIA_PASSO_A_PASSO.md        # guia da atividade anterior (MFE + deploy)
├── GUIA_MONGODB_CRUD.md          # guia desta atividade (MongoDB + CRUD)
├── EVIDENCIAS_MONGODB.md          # documento de evidências desta atividade
├── frontend/                       # aplicação React (Vite)
└── api/                             # Azure Functions (Node.js, modelo v4)
    └── src/functions/
        ├── searchPedidos.js          # GET    /api/pedidos
        ├── createPedido.js           # POST   /api/pedidos
        ├── updatePedido.js           # PUT    /api/pedidos/{id}
        └── deletePedido.js           # DELETE /api/pedidos/{id}
```

# Grupo

- Fernando Padilha
- Hector Saldivar
- Theo Otto
- Vinicius Veiga
