#!/usr/bin/env bash
set -Eeuo pipefail

# Template inicial de release para VPS/HostGator com Node + PM2.
# Ajuste os caminhos e nomes antes do primeiro uso em producao.

APP_ROOT="${APP_ROOT:-$HOME/apps/role-chat-game}"
BACKEND_DIR="${BACKEND_DIR:-$APP_ROOT/Backend}"
FRONTEND_DIR="${FRONTEND_DIR:-$APP_ROOT/Frontend}"
BRANCH="${BRANCH:-main}"
BACKEND_PM2_NAME="${BACKEND_PM2_NAME:-lunaria-backend}"
FRONTEND_PM2_NAME="${FRONTEND_PM2_NAME:-lunaria-frontend}"
FRONTEND_PORT="${FRONTEND_PORT:-4173}"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

require_dir() {
  local path="$1"
  if [[ ! -d "$path" ]]; then
    echo "Diretorio nao encontrado: $path" >&2
    exit 1
  fi
}

require_dir "$BACKEND_DIR"
require_dir "$FRONTEND_DIR"

read_env_value() {
  local key="$1"
  local file="$2"
  local line value
  line=$(grep -m1 "^${key}=" "$file" || true)
  if [[ -z "$line" ]]; then
    return 1
  fi
  value="${line#*=}"
  value="${value%$'\r'}"
  if [[ ${value:0:1} == '"' && ${value: -1} == '"' ]]; then
    value="${value:1:${#value}-2}"
  elif [[ ${value:0:1} == "'" && ${value: -1} == "'" ]]; then
    value="${value:1:${#value}-2}"
  fi
  printf '%s' "$value"
}

if [[ ! -f "$BACKEND_DIR/.env" ]]; then
  echo "Arquivo .env nao encontrado em: $BACKEND_DIR/.env" >&2
  exit 1
fi

DATABASE_URL="$(read_env_value DATABASE_URL "$BACKEND_DIR/.env" || true)"
UPSTASH_REDIS_URL="$(read_env_value UPSTASH_REDIS_URL "$BACKEND_DIR/.env" || true)"
export DATABASE_URL
export UPSTASH_REDIS_URL

if [[ -z "$DATABASE_URL" ]]; then
  echo "DATABASE_URL ausente no .env do backend" >&2
  exit 1
fi

log "Atualizando backend"
git -C "$BACKEND_DIR" fetch origin "$BRANCH"
git -C "$BACKEND_DIR" checkout "$BRANCH"
git -C "$BACKEND_DIR" pull --ff-only origin "$BRANCH"

log "Atualizando frontend"
git -C "$FRONTEND_DIR" fetch origin "$BRANCH"
git -C "$FRONTEND_DIR" checkout "$BRANCH"
git -C "$FRONTEND_DIR" pull --ff-only origin "$BRANCH"

log "Instalando dependencias do backend"
npm --prefix "$BACKEND_DIR" ci --include=dev

log "Validando conexao com banco"
pg_isready -d "$DATABASE_URL" -t 5

log "Gerando backup do banco"
mkdir -p "$APP_ROOT/backups"
BACKUP_FILE="$APP_ROOT/backups/lunaria-$(date +%Y%m%d-%H%M%S).dump"
pg_dump --dbname="$DATABASE_URL" --no-owner --no-acl -Fc > "$BACKUP_FILE"

log "Aplicando migracoes do backend"
npx --prefix "$BACKEND_DIR" prisma generate
npx --prefix "$BACKEND_DIR" prisma migrate deploy

log "Instalando dependencias e buildando frontend"
npm --prefix "$FRONTEND_DIR" ci --include=dev
npm --prefix "$FRONTEND_DIR" run build

log "Reiniciando backend via PM2"
if pm2 describe "$BACKEND_PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$BACKEND_PM2_NAME"
else
  pm2 start "npm start" --name "$BACKEND_PM2_NAME" --cwd "$BACKEND_DIR"
fi

log "Reiniciando frontend via PM2"
if pm2 describe "$FRONTEND_PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$FRONTEND_PM2_NAME"
else
  pm2 serve "$FRONTEND_DIR/dist" "$FRONTEND_PORT" --name "$FRONTEND_PM2_NAME" --spa
fi

pm2 save
log "Release concluido"
