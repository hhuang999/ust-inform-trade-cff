#!/bin/bash
# Coze 平台契约:平台在 /mydata/projects 跑 `pnpm start` → 本脚本。
# 委托到我们的 app,用 next start 提供已构建产物(原生 basePath 已烤进 build)。
set -Eeuo pipefail

APP_DIR=/mydata/ust-inform-trade-cff
cd "$APP_DIR"

# 平台传参形如 "-p" "3000";解析端口
PORT=""
while [ $# -gt 0 ]; do
  case "$1" in
    -p) PORT="$2"; shift 2 ;;
    -p*) PORT="${1#-p}"; shift ;;
    *) shift ;;
  esac
done
PORT="${PORT:-${DEPLOY_RUN_PORT:-3000}}"
export PORT

if [ -f .env.local ]; then set -a; . ./.env.local; set +a; fi
export BASE_PATH="${BASE_PATH:-${NEXT_PUBLIC_BASE_PATH:-/apps/ust-inform-trade}}"
export NEXT_PUBLIC_BASE_PATH="$BASE_PATH"

echo "Starting ust-inform-trade on 0.0.0.0:${PORT} (BASE_PATH=$BASE_PATH) ..."

# 保险:若平台跳过 build 步骤,这里兜底生成 Prisma client 与构建产物
pnpm prisma generate >/dev/null 2>&1 || true
if [ ! -f .next/BUILD_ID ]; then
  echo "No build found, building now..."
  pnpm next build
fi

# Next 16 必须用 `pnpm exec next start`,`pnpm run start -- -H` 会把 -H 当目录
exec pnpm exec next start -H 0.0.0.0 -p "$PORT"
