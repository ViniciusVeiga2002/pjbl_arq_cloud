# Links da entrega (para a seção de links do Arc42)

**Alunos:** Fernando Padilha, Hector Saldivar, Theo Otto, Vinicius Veiga

## GitHub (públicos)
- Microfrontend: https://github.com/ViniciusVeiga2002/pjbl-frontend
- API Gateway: https://github.com/ViniciusVeiga2002/pjbl-gateway
- BFF: https://github.com/ViniciusVeiga2002/pjbl-bff
- Microsserviço Pedidos (MongoDB): https://github.com/ViniciusVeiga2002/pjbl-servico-pedidos
- Microsserviço Frota: https://github.com/ViniciusVeiga2002/pjbl-servico-frota
- Azure Function: https://github.com/ViniciusVeiga2002/pjbl-funcao-enriquecimento
- Guarda-chuva (Arc42, C4, Canvas, testes de arquitetura): https://github.com/ViniciusVeiga2002/pjbl_arq_cloud

## Docker Hub (viniciusveigadesantana)
`pjbl-frontend`, `pjbl-gateway`, `pjbl-bff`, `pjbl-servico-pedidos`, `pjbl-servico-frota`, `pjbl-funcao-enriquecimento` (tags `v1` e `latest`)
— https://hub.docker.com/u/viniciusveigadesantana

## Swagger / URLs na nuvem
- Frontend: https://pjbl-frontend.greenground-94454a2d.eastus2.azurecontainerapps.io/
- API Gateway: https://pjbl-arq-cloud-gateway.azurewebsites.net/api/docs
- BFF: https://pjbl-arq-cloud-bff-web.azurewebsites.net/api/docs
- Microsserviço Pedidos: https://pjbl-arq-cloud-pedidos.azurewebsites.net/api/docs
- Microsserviço Frota: https://pjbl-arq-cloud-frota.azurewebsites.net/api/docs
- Azure Function: https://pjbl-arq-cloud-enriquecimento.azurewebsites.net/api/docs
- Endpoint obrigatório: https://pjbl-arq-cloud-gateway.azurewebsites.net/api/web/aggregated-data
- Eventos: filas `pedidos-eventos` e `telemetria-veiculos` (Azure Queue Storage, conta `pjblarqcloudeventos`) — documentadas no Arc42 (seção de eventos) e visíveis no portal Azure.

## Vídeo (YouTube, não listado)
_colar o link aqui_

## Desvio documentado
Azure SQL (free) indisponível na assinatura Azure for Students — ver [LIMITACAO_AZURE_SQL.md](LIMITACAO_AZURE_SQL.md).
O microsserviço de Frota usa MongoDB Atlas free (banco próprio `pjbl_frota`) e já tem o adaptador Azure SQL pronto.

## Prints a tirar (nas URLs acima)
1. Swagger do Gateway/BFF  2. Swagger de Pedidos e Frota  3. Frontend funcionando  4. Gateway (`/api/web/aggregated-data` no navegador)
