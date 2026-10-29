#!/usr/bin/env bash
# Backup do banco da comissão (roda todo dia pelo systemd, como usuário postgres).
# Guarda os últimos DIAS dias em DESTINO e confere se cada arquivo abre.
#
# Para restaurar um backup (APAGA os dados atuais e volta para os do arquivo):
#   sudo -u postgres pg_restore --clean --if-exists -d comissao /var/backups/comissao/ARQUIVO.dump
set -euo pipefail

DESTINO="${DESTINO:-/var/backups/comissao}"
DIAS="${DIAS:-30}"
BANCO="${BANCO:-comissao}"

umask 077
mkdir -p "$DESTINO"
arquivo="$DESTINO/$BANCO-$(date +%Y-%m-%d_%H%M).dump"

pg_dump -Fc -d "$BANCO" -f "$arquivo.parcial"
pg_restore --list "$arquivo.parcial" > /dev/null # confere se o arquivo está íntegro
mv "$arquivo.parcial" "$arquivo"

# Apaga os backups mais antigos que DIAS dias.
find "$DESTINO" -maxdepth 1 -name "$BANCO-*.dump" -mtime +"$DIAS" -delete

echo "Backup ok: $arquivo ($(du -h "$arquivo" | cut -f1)). Backups guardados: $(ls "$DESTINO"/"$BANCO"-*.dump | wc -l)"
