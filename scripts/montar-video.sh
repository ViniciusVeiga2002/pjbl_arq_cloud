#!/bin/bash
# Monta o vídeo final em 4 etapas. Cada etapa tem:
#   1) um cartão de abertura com o áudio de apresentação do integrante
#      (nome, título da etapa e o que será mostrado);
#   2) a gravação de tela da etapa, MUDA (o áudio original é descartado),
#      com uma legenda fixa embaixo explicando o que está na tela.
#
# Arquivos esperados (na raiz do projeto):
#   audios/intro-vinicius.*  audios/intro-fernando.*  audios/intro-hector.*  audios/intro-theo.*
#   gravacoes/etapa1.*  etapa2.*  etapa3.*  etapa4.*      (mov ou mp4)
# Uso: scripts/montar-video.sh [saida.mp4]
set -e
cd "$(dirname "$0")/.."
SAIDA="${1:-video-final.mp4}"; TMP=$(mktemp -d); LISTA="$TMP/lista.txt"; : > "$LISTA"
achar() { ls $1.* 2>/dev/null | head -1; }

# nome | arquivo do áudio | título | o que será mostrado (cartão) | legenda durante a gravação
ETAPAS=(
"Vinicius Veiga|audios/intro-vinicius|Etapa 1 — Frontend e visão da arquitetura|Frontend (React) na nuvem · API Gateway · BFF|Frontend em Azure Container Apps chamando o API Gateway, que roteia para o BFF"
"Fernando Padilha|audios/intro-fernando|Etapa 2 — Chamadas passando pelo BFF|Rede do navegador · GET /aggregated-data · Swagger do BFF|Frontend → API Gateway → BFF: endpoint /aggregated-data junta Pedidos, Frota e a Azure Function"
"Hector Saldivar|audios/intro-hector|Etapa 3 — CRUD e bancos de dados|CRUD de pedidos · MongoDB Atlas · Swagger dos microsserviços|CRUD completo de pedidos (MongoDB Atlas). Frota também no Atlas: Azure SQL indisponível na assinatura Students"
"Theo Otto|audios/intro-theo|Etapa 4 — Eventos, Azure Function e qualidade|Fila de eventos · Azure Function · testes de arquitetura · GitHub e Docker Hub|Evento na fila → Frota atualiza · Azure Function (HTTP) · testes, pipeline verde, GitHub e Docker Hub"
)

estilo() { python3 - "$@" <<'PY'
import sys, textwrap
from PIL import Image, ImageDraw, ImageFont
modo, saida = sys.argv[1], sys.argv[2]
F = '/System/Library/Fonts/Helvetica.ttc'
fonte = lambda t: ImageFont.truetype(F, t)
if modo == 'cartao':
    nome, titulo, itens = sys.argv[3:6]
    img = Image.new('RGB', (1920, 1080), (18, 28, 48)); d = ImageDraw.Draw(img)
    d.text((140, 330), titulo, font=fonte(68), fill='white')
    d.text((140, 450), itens, font=fonte(38), fill=(170, 200, 240))
    d.text((140, 760), f'Apresentação: {nome}', font=fonte(44), fill=(255, 205, 90))
    d.text((140, 980), 'PJBL — Arquitetura de Soluções / Computação em Nuvem · PUCPR', font=fonte(28), fill=(120, 140, 170))
    img.save(saida)
else:
    legenda = sys.argv[3]
    linhas = textwrap.wrap(legenda, 95)
    img = Image.new('RGBA', (1920, 40 + 50 * len(linhas)), (0, 0, 0, 190)); d = ImageDraw.Draw(img)
    for i, l in enumerate(linhas): d.text((40, 20 + 50 * i), l, font=fonte(36), fill='white')
    img.save(saida)
PY
}

n=0
for e in "${ETAPAS[@]}"; do
  n=$((n+1)); IFS='|' read -r nome audio titulo itens legenda <<< "$e"
  AUD=$(achar "$audio"); CLIP=$(achar "gravacoes/etapa$n")
  [ -n "$AUD" ] || { echo "Falta o áudio $audio.*"; exit 1; }
  [ -n "$CLIP" ] || { echo "Falta a gravação gravacoes/etapa$n.*"; exit 1; }
  [ -f "legendas/etapa$n.txt" ] && legenda=$(cat "legendas/etapa$n.txt")
  # cartão de abertura com o áudio de apresentação
  ffmpeg -v error -y -i "$AUD" -ar 44100 -ac 2 "$TMP/a$n.wav"
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP/a$n.wav")
  estilo cartao "$TMP/c$n.png" "$nome" "$titulo" "$itens"
  ffmpeg -v error -y -loop 1 -framerate 30 -i "$TMP/c$n.png" -i "$TMP/a$n.wav" -t "$(echo "$DUR+0.8" | bc)" \
    -vf "format=yuv420p" -af "apad=pad_dur=0.8" -c:v libx264 -c:a aac -ar 44100 -ac 2 -r 30 "$TMP/p$n.mp4"
  # gravação de tela, sem som, com legenda
  estilo legenda "$TMP/l$n.png" "$legenda"
  ffmpeg -v error -y -i "$CLIP" -i "$TMP/l$n.png" -f lavfi -i anullsrc=r=44100:cl=stereo -filter_complex \
    "[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v];[v][1:v]overlay=0:H-h[o]" \
    -map "[o]" -map 2:a -shortest -c:v libx264 -pix_fmt yuv420p -c:a aac -ar 44100 -ac 2 "$TMP/g$n.mp4"
  echo "file '$TMP/p$n.mp4'" >> "$LISTA"; echo "file '$TMP/g$n.mp4'" >> "$LISTA"
done
ffmpeg -v error -y -f concat -safe 0 -i "$LISTA" -c copy "$SAIDA"
echo "Vídeo gerado: $SAIDA ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SAIDA" | cut -d. -f1)s)"
