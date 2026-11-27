#!/bin/bash
# baixa um pacote do Kenney: página -> id -> link assinado -> zip
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
slug=$1; jar=$(mktemp); dest=pacotes/$slug; mkdir -p "$dest"
curl -s -m 30 -A "$UA" -c "$jar" -b "$jar" -L -o "$dest/pagina.html" "https://kenney.nl/assets/$slug"
id=$(grep -oE "data-download-id='[0-9a-f]+'" "$dest/pagina.html" | head -1 | cut -d"'" -f2)
[ -z "$id" ] && { echo "$slug: sem id"; exit 1; }
url=$(curl -s -m 30 -A "$UA" -c "$jar" -b "$jar" -H "Referer: https://kenney.nl/assets/$slug" "https://kenney.nl/download-link/$id" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("url",""))')
[ -z "$url" ] && { echo "$slug: sem url"; exit 1; }
curl -s -m 300 -A "$UA" -b "$jar" -L -o "$dest/pacote.zip" "$url"
echo "$slug: $(du -h "$dest/pacote.zip" | cut -f1) $(file -b "$dest/pacote.zip" | cut -c1-30)"
