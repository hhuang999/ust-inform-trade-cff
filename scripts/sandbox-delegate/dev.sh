#!/bin/bash
# 平台若以 dev 模式启动也委托到我们的 app(用 next dev,避免 coze 的 dev lock 问题)。
set -Eeuo pipefail

APP_DIR=/mydata/ust-inform-trade-cff
cd "$APP_DIR"

PORT=""
while [ $# -gt 0 ]; do
  case "$1" in
    -p) PORT="$2"; shift 2 ;;
    -p*) PORT="${1#-p}"; shift ;;
    *) shift ;;
  esac
done
PORT="${PORT:-${DEPLOY_RUN_PORT:-3000}}"

if [ -f .env.local ]; then set -a; . ./.env.local; set +a; fi
export BASE_PATH="${BASE_PATH:-${NEXT_PUBLIC_BASE_PATH:-/apps/ust-inform-trade}}"
export NEXT_PUBLIC_BASE_PATH="$BASE_PATH"
export PORT

echo "Dev ust-inform-trade on 0.0.0.0:${PORT} (BASE_PATH=$BASE_PATH) ..."
exec pnpm exec next dev -H 0.0.0.0 -p "$PORT"
