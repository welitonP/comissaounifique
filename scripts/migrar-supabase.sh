#!/usr/bin/env bash
# Copia os DADOS do Supabase (produção) para o banco local da VM.
#
# - Só LÊ do Supabase: nada é alterado lá.
# - O banco local precisa já ter as tabelas (npx prisma db push).
# - Os dados locais são APAGADOS e substituídos pela cópia.
# - Funciona mesmo com versões diferentes do PostgreSQL (copia tabela por
#   tabela com \copy, sem pg_dump).
#
# Uso (na pasta do projeto, com a conexão do Supabase na variável SUPA):
#   SUPA="$SUPA" bash scripts/migrar-supabase.sh
#
# Opcional: BANCO_LOCAL (padrão: comissao).

set -euo pipefail

BANCO_LOCAL="${BANCO_LOCAL:-comissao}"

if [ -z "${SUPA:-}" ]; then
  echo "ERRO: a variável SUPA (conexão do Supabase) está vazia."
  echo "Rode assim: SUPA=\"\$SUPA\" bash scripts/migrar-supabase.sh"
  exit 1
fi

# psql no Supabase (só leitura) e no banco local (como superusuário postgres,
# para poder desligar as checagens de chave estrangeira durante a carga).
supa() { psql "$SUPA" -X -v ON_ERROR_STOP=1 "$@"; }
local_db() { sudo -u postgres psql -X -v ON_ERROR_STOP=1 -d "$BANCO_LOCAL" "$@"; }

echo "== Conferindo conexões =="
supa -Atc "select 'Supabase ok: PostgreSQL ' || current_setting('server_version')"
local_db -Atc "select 'Local ok: PostgreSQL ' || current_setting('server_version')"

# Tabelas com RLS (segurança por linha) escondem as linhas de quem não é dono.
# Sem permissão de ignorar o RLS, a cópia sairia vazia sem dar erro.
COM_RLS=$(supa -Atc "select count(*) from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' and relrowsecurity")
PODE_IGNORAR=$(supa -Atc "select (rolbypassrls or rolsuper)::text from pg_roles where rolname = current_user")
if [ "$COM_RLS" != "0" ] && [ "$PODE_IGNORAR" != "true" ]; then
  echo
  echo "ERRO: $COM_RLS tabela(s) do Supabase têm RLS ligado e o usuário desta conexão"
  echo "não pode ignorá-lo. A cópia sairia VAZIA. Nada foi alterado."
  echo "No SQL Editor do Supabase, rode:  alter role <usuario> bypassrls;"
  exit 1
fi

LISTA_TABELAS="select tablename from pg_tables where schemaname = 'public' and tablename <> '_prisma_migrations' order by 1"
mapfile -t TABELAS_SUPA < <(supa -Atc "$LISTA_TABELAS")
mapfile -t TABELAS_LOCAL < <(local_db -Atc "$LISTA_TABELAS")

if [ "${#TABELAS_SUPA[@]}" -eq 0 ]; then
  echo "ERRO: nenhuma tabela encontrada no Supabase (o usuário tem permissão de leitura?)."
  exit 1
fi
if [ "${#TABELAS_LOCAL[@]}" -eq 0 ]; then
  echo "ERRO: o banco local não tem tabelas. Rode antes: npx prisma db push"
  exit 1
fi

existe_local() {
  local t="$1" x
  for x in "${TABELAS_LOCAL[@]}"; do [ "$x" = "$t" ] && return 0; done
  return 1
}

COPIAR=()
for t in "${TABELAS_SUPA[@]}"; do
  if existe_local "$t"; then
    COPIAR+=("$t")
  else
    echo "AVISO: tabela \"$t\" existe no Supabase mas não no banco local (pulando)."
  fi
done

echo
echo "== Limpando o banco local (${#COPIAR[@]} tabelas) =="
LISTA_TRUNCATE=""
for t in "${COPIAR[@]}"; do LISTA_TRUNCATE+="\"$t\","; done
local_db -qc "TRUNCATE ${LISTA_TRUNCATE%,} CASCADE"

COLUNAS_SQL="select column_name from information_schema.columns where table_schema = 'public' and table_name = :'t' order by ordinal_position"

echo
echo "== Copiando dados =="
for t in "${COPIAR[@]}"; do
  mapfile -t COL_SUPA < <(supa -At -v t="$t" <<<"$COLUNAS_SQL")
  mapfile -t COL_LOCAL < <(local_db -At -v t="$t" <<<"$COLUNAS_SQL")

  # Só as colunas que existem nos dois lados, na mesma ordem.
  COLS=""
  for c in "${COL_SUPA[@]}"; do
    achou=0
    for d in "${COL_LOCAL[@]}"; do [ "$c" = "$d" ] && achou=1 && break; done
    if [ "$achou" -eq 1 ]; then
      COLS+="\"$c\","
    else
      echo "  AVISO: coluna \"$t\".\"$c\" não existe no banco local (ignorada)."
    fi
  done
  COLS="${COLS%,}"

  supa -c "\\copy (select $COLS from public.\"$t\") to stdout with (format csv)" \
    | local_db -q -c "set session_replication_role = replica" \
                  -c "\\copy public.\"$t\" ($COLS) from stdin with (format csv)"
  printf "  %-28s copiada\n" "$t"
done

echo
echo "== Conferindo quantidades (Supabase x local) =="
DIFERENCAS=0
TOTAL_SUPA=0
for t in "${COPIAR[@]}"; do
  n_supa=$(supa -Atc "select count(*) from public.\"$t\"")
  TOTAL_SUPA=$((TOTAL_SUPA + n_supa))
  n_local=$(local_db -Atc "select count(*) from public.\"$t\"")
  if [ "$n_supa" = "$n_local" ]; then status="ok"; else status="DIFERENTE"; DIFERENCAS=$((DIFERENCAS + 1)); fi
  printf "  %-28s %8s %8s   %s\n" "$t" "$n_supa" "$n_local" "$status"
done

echo
if [ "$TOTAL_SUPA" -eq 0 ]; then
  echo "ATENÇÃO: o Supabase devolveu ZERO linhas em todas as tabelas. Confira as permissões do usuário."
  exit 3
fi
if [ "$DIFERENCAS" -eq 0 ]; then
  echo "PRONTO: todos os dados foram copiados e as quantidades batem."
else
  echo "ATENÇÃO: $DIFERENCAS tabela(s) com quantidade diferente. Veja a lista acima."
  exit 2
fi
