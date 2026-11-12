// Especificação OpenAPI 3 e página do Swagger UI deste projeto.
// O Swagger UI é carregado do cdnjs (versão fixa); a página só aponta para
// o /api/openapi.json do próprio Function App.
export const especificacaoOpenApi = {
  "openapi": "3.0.3",
  "info": {
    "title": "Azure Function de Enriquecimento (HTTP Trigger)",
    "version": "1.0.0",
    "description": "Calcula o risco de atraso por pedido. Função pura, sem banco. Chamada só pelo BFF."
  },
  "servers": [
    {
      "url": "/api"
    }
  ],
  "paths": {
    "/enriquecer": {
      "post": {
        "tags": [
          "Enriquecimento"
        ],
        "summary": "Calcular risco de atraso",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/EnriquecerEntrada"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Risco por pedido e resumo",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Enriquecimento"
                }
              }
            }
          },
          "400": {
            "description": "Requisição inválida",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          },
          "500": {
            "description": "Erro interno",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "EnriquecerEntrada": {
        "type": "object",
        "required": [
          "pedidos"
        ],
        "properties": {
          "pedidos": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Pedido"
            }
          },
          "veiculos": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "placa": {
                  "type": "string"
                },
                "status": {
                  "type": "string"
                }
              }
            }
          }
        }
      },
      "Pedido": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "status": {
            "type": "string"
          },
          "veiculoPlaca": {
            "type": "string"
          },
          "previsaoEntrega": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "Enriquecimento": {
        "type": "object",
        "properties": {
          "geradoEm": {
            "type": "string"
          },
          "resumo": {
            "type": "object",
            "properties": {
              "totalDePedidos": {
                "type": "integer"
              },
              "pedidosAtrasados": {
                "type": "integer"
              },
              "pedidosEntregues": {
                "type": "integer"
              },
              "taxaDeAtraso": {
                "type": "number"
              },
              "riscoMedio": {
                "type": "integer"
              },
              "nivelGeral": {
                "type": "string",
                "enum": [
                  "baixo",
                  "medio",
                  "alto"
                ]
              }
            }
          },
          "pedidos": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "score": {
                  "type": "integer"
                },
                "nivel": {
                  "type": "string"
                },
                "motivos": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              }
            }
          }
        }
      },
      "Erro": {
        "type": "object",
        "properties": {
          "erro": {
            "type": "string"
          },
          "detalhe": {
            "type": "string"
          }
        }
      }
    }
  }
} as const;

export const paginaSwaggerUi = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${especificacaoOpenApi.info.title}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.min.js"></script>
  <script>window.ui = SwaggerUIBundle({ url: 'openapi.json', dom_id: '#swagger-ui' });</script>
</body>
</html>`;
