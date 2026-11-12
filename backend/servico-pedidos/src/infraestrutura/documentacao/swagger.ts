// Especificação OpenAPI 3 e página do Swagger UI deste projeto.
// O Swagger UI é carregado do cdnjs (versão fixa); a página só aponta para
// o /api/openapi.json do próprio Function App.
export const especificacaoOpenApi = {
  "openapi": "3.0.3",
  "info": {
    "title": "Serviço de Pedidos (MongoDB Atlas)",
    "version": "1.0.0",
    "description": "Microsserviço 1 — CRUD de pedidos, banco pjbl_pedidos. Publica eventos na fila pedidos-eventos. Chamado só pelo BFF (x-functions-key)."
  },
  "servers": [
    {
      "url": "/api"
    }
  ],
  "paths": {
    "/pedidos": {
      "get": {
        "tags": [
          "Pedidos"
        ],
        "summary": "Pesquisar pedidos",
        "parameters": [
          {
            "name": "cliente",
            "in": "query",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "status",
            "in": "query",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "entregaId",
            "in": "query",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Lista de pedidos",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Pedido"
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
      },
      "post": {
        "tags": [
          "Pedidos"
        ],
        "summary": "Cadastrar pedido (publica PedidoCadastrado na fila)",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PedidoEntrada"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Pedido criado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Pedido"
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
    "/pedidos/{id}": {
      "put": {
        "tags": [
          "Pedidos"
        ],
        "summary": "Alterar pedido (publica PedidoAlterado)",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PedidoEntrada"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Pedido alterado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Pedido"
                }
              }
            }
          },
          "404": {
            "description": "Não encontrado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
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
      },
      "delete": {
        "tags": [
          "Pedidos"
        ],
        "summary": "Excluir pedido (publica PedidoExcluido)",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Excluído"
          },
          "404": {
            "description": "Não encontrado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Erro"
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
      "Pedido": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "example": "PED-1"
          },
          "cliente": {
            "type": "string"
          },
          "entregaId": {
            "type": "string",
            "example": "ENT-501"
          },
          "veiculoPlaca": {
            "type": "string",
            "example": "ABC-1D23"
          },
          "status": {
            "type": "string",
            "enum": [
              "Aguardando coleta",
              "Em rota",
              "Entregue",
              "Atrasado"
            ]
          },
          "previsaoEntrega": {
            "type": "string",
            "format": "date-time"
          },
          "criadoEm": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "PedidoEntrada": {
        "type": "object",
        "required": [
          "cliente",
          "entregaId"
        ],
        "properties": {
          "cliente": {
            "type": "string"
          },
          "entregaId": {
            "type": "string"
          },
          "veiculoPlaca": {
            "type": "string"
          },
          "status": {
            "type": "string"
          },
          "previsaoEntrega": {
            "type": "string",
            "format": "date-time"
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
