#!/bin/bash
# Monta o vídeo final: gravação de tela + áudios dos 4 integrantes (em sequência),
# com o nome de quem está falando no canto da tela.
# Uso: scripts/montar-video.sh gravacao-de-tela.mp4 [saida.mp4]
set -e
cd "$(dirname "$0")/.."
TELA="${1:?informe a gravação de tela (mp4/mov)}"; SAIDA="${2:-video-final.mp4}"
ORDEM=("audios/audio Vinicius.opus|Vinicius Veiga" "audios/audio Fernando.opus|Fernando Padilha" "audios/audio Hector.opus|Hector Saldivar" "audios/audio theo.opus|Theo Otto")
TMP=$(mktemp -d); : > "$TMP/lista.txt"
T=0; i=0; INPUTS=(); OVERLAYS=""; PREV="base"
for item in "${ORDEM[@]}"; do
  arq="${item%%|*}"; nome="${item##*|}"
  ffmpeg -v error -y -i "$arq" -ar 44100 -ac 1 "$TMP/a$i.wav"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP/a$i.wav")
  echo "file '$TMP/a$i.wav'" >> "$TMP/lista.txt"
  python3 - "$nome" "$TMP/n$i.png" <<'PY'
import sys
from PIL import Image, ImageDraw, ImageFont
nome, saida = sys.argv[1], sys.argv[2]
fonte = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 44)
txt = f'Falando: {nome}'; w = int(fonte.getlength(txt)) + 50
img = Image.new('RGBA', (w, 84), (0, 0, 0, 170)); ImageDraw.Draw(img).text((25, 16), txt, font=fonte, fill='white'); img.save(saida)
PY
  INPUTS+=(-i "$TMP/n$i.png")
  FIM=$(echo "$T+$dur" | bc)
  OVERLAYS="$OVERLAYS;[$PREV][$((i+2)):v]overlay=40:H-h-40:enable='between(t,$T,$FIM)'[o$i]"; PREV="o$i"
  T=$FIM; i=$((i+1))
done
ffmpeg -v error -y -f concat -safe 0 -i "$TMP/lista.txt" -c copy "$TMP/audio.wav"
# a tela é congelada no fim (ou cortada) para cobrir exatamente a narração
ffmpeg -v error -y -i "$TELA" -i "$TMP/audio.wav" "${INPUTS[@]}" -filter_complex \
  "[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,tpad=stop_mode=clone:stop_duration=$T[base]$OVERLAYS" \
  -map "[$PREV]" -map 1:a -t "$T" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 160k "$SAIDA"
echo "Vídeo gerado: $SAIDA (${T}s)"
