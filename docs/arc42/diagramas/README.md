# Diagramas (fontes PlantUML)

Um arquivo `.puml` por diagrama; a imagem renderizada (PNG, 180 dpi) fica em
`render/` com o mesmo nome.

| Arquivo | Diagrama | Seção do Arc42 |
|---|---|---|
| `c4-nivel1-contexto.puml` | C4 Nível 1 — Contexto | 3.1 |
| `c4-nivel2-conteineres.puml` | C4 Nível 2 — Contêineres | 5.1 |
| `c4-nivel3-gateway-bff.puml` | C4 Nível 3 — API Gateway e BFF Web | 5.2 |
| `c4-nivel3-servico-pedidos.puml` | C4 Nível 3 — Serviço de Pedidos | 5.2 |
| `c4-nivel3-servico-frota.puml` | C4 Nível 3 — Serviço de Frota | 5.2 |
| `uml-classes-servico-pedidos.puml` | C4 Nível 4 — Classes (UML), domínio de pedidos | 5.3 |
| `uml-classes-servico-frota.puml` | C4 Nível 4 — Classes (UML), domínio de frota | 5.3 |
| `uml-componentes-frontend.puml` | C4 Nível 4 — Componentes (UML), microfrontends | 5.3 |
| `uml-sequencia-cadastrar-pedido.puml` | C4 Nível 4 — Sequência: cadastrar pedido | 6.1 |
| `uml-sequencia-concluir-entrega.puml` | C4 Nível 4 — Sequência: concluir entrega (EDA) | 6.2 |
| `uml-sequencia-telemetria.puml` | C4 Nível 4 — Sequência: telemetria até o painel | 6.3 |
| `deployment.puml` | Implantação (UML) | 7 |
| `der-database-per-service.puml` | DER (pé-de-galinha), um banco por serviço | 8.1 |
| `regras-de-arquitetura.puml` | Regras verificadas pelos testes de arquitetura | 8.10 |

## Como renderizar

Com o Graphviz instalado (`brew install graphviz`) e o JAR do PlantUML (o da
extensão do VS Code serve):

```bash
cd docs/arc42/diagramas
java -jar ~/.vscode/extensions/jebbs.plantuml-2.18.1/plantuml.jar -charset UTF-8 -tpng -o render *.puml
```

Os diagramas C4 usam a biblioteca C4-PlantUML **embutida** no PlantUML
(`!include <C4/C4_Container>`), sem acesso à internet.

## Legibilidade no Word

Os diagramas de sequência e o de classes do serviço de pedidos são mais
largos que altos: no Word, coloque-os numa seção em **orientação paisagem**
(Layout → Quebras → Próxima página; depois Orientação → Paisagem só nessa
seção) e ajuste a imagem à largura da página. Os demais cabem em retrato
com largura de 16 cm.
