// Especificação OpenAPI 3 e página do Swagger UI deste projeto.
// O Swagger UI é carregado do cdnjs (versão fixa); a página só aponta para
// o /api/openapi.json do próprio Function App.
export const especificacaoOpenApi = {
  "openapi": "3.0.3",
  "info": {
    "title": "Serviço de Frota (Azure SQL)",
    "version": "1.0.0",
    "description": "Microsserviço 2 — veículos (telemetria OBD2/GPS) e projeção de entregas, banco Azure SQL pjbl_frota. Consome as filas pedidos-eventos e telemetria-veiculos."
  },
  "servers": [
    {
      "url": "/api"
    }
  ],
  "paths": {
    "/veiculos": {
      "get": {
        "tags": [
          "Veículos"
        ],
        "summary": "Listar veículos",
        "parameters": [
          {
            "name": "status",
            "in": "query",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Veículos",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Veiculo"
                  }
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
    },
    "/entregas": {
      "get": {
        "tags": [
          "Entregas"
        ],
        "summary": "Listar entregas (projeção dos eventos de pedidos)",
        "responses": {
          "200": {
            "description": "Entregas",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Entrega"
                  }
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
      "Veiculo": {
        "type": "object",
        "properties": {
          "placa": {
            "type": "string"
          },
          "motorista": {
            "type": "string"
          },
          "lat": {
            "type": "number"
          },
          "lng": {
            "type": "number"
          },
          "velocidade": {
            "type": "number"
          },
          "status": {
            "type": "string",
            "enum": [
              "ok",
              "parado",
              "alerta-velocidade"
            ]
          },
          "registradoEm": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "Entrega": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "veiculoPlaca": {
            "type": "string"
          },
          "situacao": {
            "type": "string"
          },
          "totalDePedidos": {
            "type": "integer"
          },
          "pedidosEntregues": {
            "type": "integer"
          },
          "pedidosAtrasados": {
            "type": "integer"
          },
          "atualizadoEm": {
            "type": "string",
            "format": "date-time",
            "nullable": true
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
