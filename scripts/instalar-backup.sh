#!/usr/bin/env bash
# Instala o backup automático diário do banco (03:15, guarda 30 dias).
# Uso, na pasta do projeto:  sudo bash scripts/instalar-backup.sh
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Rode com sudo: sudo bash scripts/instalar-backup.sh"
  exit 1
fi

PASTA="$(cd "$(dirname "$0")" && pwd)"

install -m 755 "$PASTA/backup-banco.sh" /usr/local/bin/comissao-backup
install -d -o postgres -g postgres -m 700 /var/backups/comissao

cat > /etc/systemd/system/comissao-backup.service <<'UNIT'
[Unit]
Description=Backup do banco da Comissao de Esportes
After=postgresql.service

[Service]
Type=oneshot
User=postgres
ExecStart=/usr/local/bin/comissao-backup
UNIT

cat > /etc/systemd/system/comissao-backup.timer <<'UNIT'
[Unit]
Description=Backup diario do banco da Comissao de Esportes

[Timer]
OnCalendar=*-*-* 03:15:00
RandomizedDelaySec=10m
Persistent=true

[Install]
WantedBy=timers.target
UNIT

systemctl daemon-reload
systemctl enable --now comissao-backup.timer

echo "== Fazendo o primeiro backup agora =="
systemctl start comissao-backup.service
journalctl -u comissao-backup.service -n 3 --no-pager -o cat
echo
echo "== Próximo backup automático =="
systemctl list-timers comissao-backup.timer --no-pager | head -2
