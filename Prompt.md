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

