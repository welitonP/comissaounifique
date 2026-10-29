#!/usr/bin/env bash
# Grava (ou troca) uma configuração no .env, pedindo o valor escondido.
# O valor não aparece na tela nem fica no histórico do terminal.
#
# Uso, na pasta do projeto:
#   bash scripts/definir-config.sh ANTHROPIC_API_KEY
#   bash scripts/definir-config.sh RESUMO_TOKEN --gerar   (gera um valor aleatório)
# Depois: sudo systemctl restart comissao
set -euo pipefail
cd "$(dirname "$0")/.."

nome="${1:-}"
if ! [[ "$nome" =~ ^[A-Z][A-Z0-9_]*$ ]]; then
  echo "Uso: bash scripts/definir-config.sh NOME_DA_CONFIGURACAO [--gerar]"
  exit 1
fi

if [ "${2:-}" = "--gerar" ]; then
  valor="$(openssl rand -hex 32)"
  echo "Valor gerado para $nome (anote, o n8n vai precisar dele):"
  echo "  $valor"
else
  read -rsp "Cole o valor de $nome e Enter (não aparece na tela): " valor
  echo
fi

if [ -z "$valor" ]; then
  echo "Nada foi gravado: o valor veio vazio."
  exit 1
fi
if [[ "$valor" == *'"'* || "$valor" == *'$'* || "$valor" == *$'\n'* ]]; then
  echo "Nada foi gravado: o valor tem aspas (\") ou cifrão (\$), que quebram o .env."
  exit 1
fi

touch .env
cp .env .env.bak
grep -v -E "^$nome=" .env > .env.novo || true
printf '%s="%s"\n' "$nome" "$valor" >> .env.novo
mv .env.novo .env
chmod 600 .env .env.bak

echo "ok: $nome gravada (cópia anterior em .env.bak)."
echo "Para valer, reinicie o site: sudo systemctl restart comissao"
