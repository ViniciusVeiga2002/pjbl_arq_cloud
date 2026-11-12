# Imagem do Function App (Azure Functions v4, Node 22), em duas etapas:
# compila o TypeScript e entrega só o JavaScript + dependências de produção.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM mcr.microsoft.com/azure-functions/node:4-node22
ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true
WORKDIR /home/site/wwwroot
COPY host.json package.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
