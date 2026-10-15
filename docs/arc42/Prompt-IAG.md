# Registro de uso de IA generativa — Documentação de Arquitetura (Arc42)

Conforme a convenção do grupo (OC02), este arquivo registra os prompts de IAG
usados na construção da documentação de arquitetura.

## Sessão — Claude Code (VS Code), Sonnet

**Contexto entregue à IA:** `docs/arc42/CONTEXTO_ARC42.md` (decisões das sessões
anteriores) + leitura do código-fonte (`frontend/src/**`, `api/src/**`, workflow
do GitHub Actions).

**Pedido principal:**

> De acordo com o documento `docs/arc42/CONTEXTO_ARC42.md`, seguir o
> desenvolvimento da documentação: Arc42 (11 seções, template oficial), C4 Model
> (níveis 1–4, sendo o nível 4 em UML: sequência, classes e componentes), DER e
> Software Architecture Canvas. Notação correta de C4 e UML. Todos os diagramas
> nas respectivas seções.

**Ajustes de escopo dados durante a sessão:**

- Não gerar PDF; entregar os arquivos-fonte + um `.docx` (Word). As imagens dos
  diagramas serão coladas manualmente no Word.
- Base do documento: template **Markdown arc42 em português**.
- Não instalar nenhuma ferramenta na máquina. A renderização dos `.puml` é feita
  pela extensão PlantUML do VS Code.

**Produzido pela IA nesta sessão:**

- `docs/arc42/arc42-pjbl.md` — documento Arc42, seções 1 a 11, com o Software
  Architecture Canvas na seção 1 e cada diagrama referenciado na sua seção.
- `docs/arc42/diagramas/*.puml` — 9 diagramas:
  - C4 níveis 1, 2 e 3 (C4-PlantUML, include remoto fixado em v2.14.0);
  - UML de classes, de componentes, duas sequências e implantação (PlantUML puro);
  - DER em notação pé-de-galinha (PlantUML puro).
- `docs/arc42/md2docx.py` — conversor Markdown→DOCX sem dependências (biblioteca
  padrão do Python), para gerar `arc42-pjbl.docx` sem instalar pandoc/LaTeX.
- `docs/arc42/diagramas/README.md` — instruções de renderização/exportação.

**Revisão humana pendente (grupo):**

- Conferir os textos das 11 seções contra o documento de requisitos oficial.
- Renderizar cada `.puml` e validar a notação nos exemplos vistos em aula.
- Exportar os PNG e colar no `.docx` nos marcadores "‹ Inserir imagem … ›".

**Nota (2026-10-14, etapa 2):** `arc42-pjbl.md`, `arc42-pjbl.pdf`, `md2docx.py`
e `diagramas/etapa1/` foram removidos do repositório. O documento de
referência passou a ser `arc42-pjbl-FINAL.docx`, atualizado para a etapa 2
conforme `ATUALIZACAO_ARC42_ETAPA2.md`.
