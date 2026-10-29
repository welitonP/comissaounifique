#!/usr/bin/env bash
# Mostra quais configurações do .env estão preenchidas, SEM mostrar os valores.
# Uso, na pasta do projeto:  bash scripts/conferir-config.sh
cd "$(dirname "$0")/.."
ARQ=.env
[ -f "$ARQ" ] || { echo "Arquivo .env não encontrado em $(pwd)"; exit 1; }

preenchida() { grep -qE "^$1=\"?[^\"[:space:]]" "$ARQ"; }

echo "== Obrigatórias =="
for v in DATABASE_URL DIRECT_URL AUTH_SECRET; do
  if preenchida "$v"; then echo "  ok     $v"; else echo "  FALTA  $v"; fi
done
echo "== Recursos (sem elas o recurso fica desligado) =="
for v in ANTHROPIC_API_KEY GEMINI_API_KEY N8N_WEBHOOK_URL N8N_WEBHOOK_SECRET RESUMO_TOKEN; do
  if preenchida "$v"; then echo "  ok     $v"; else echo "  vazia  $v"; fi
done
