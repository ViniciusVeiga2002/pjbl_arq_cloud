# Frontend em microfrontends (shell + mfe-pedidos + mfe-frota) empacotado em
# uma imagem nginx. Build em duas etapas: Node compila os 3 builds
# independentes e o nginx serve apenas o resultado estático.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shell/package.json shell/
COPY mfe-pedidos/package.json mfe-pedidos/
COPY mfe-frota/package.json mfe-frota/
RUN npm ci
COPY . .
ARG VITE_GATEWAY_URL=https://pjbl-arq-cloud-gateway.azurewebsites.net/api
ENV VITE_GATEWAY_URL=$VITE_GATEWAY_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
