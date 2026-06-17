#!/bin/bash
# Coze 平台契约:平台在 /mydata/projects 跑 `pnpm build`。
# 委托到我们的 app,用原生 basePath 构建(子路径 /apps/ust-inform-trade)。
set -Eeuo pipefail

APP_DIR=/mydata/ust-inform-trade-cff
cd "$APP_DIR"

# 加载本地凭证/配置(若存在)
if [ -f .env.local ]; then set -a; . ./.env.local; set +a; fi

# 子路径:优先 BASE_PATH,其次 NEXT_PUBLIC_BASE_PATH(平台可能注入),默认 /apps/ust-inform-trade
export BASE_PATH="${BASE_PATH:-${NEXT_PUBLIC_BASE_PATH:-/apps/ust-inform-trade}}"
export NEXT_PUBLIC_BASE_PATH="$BASE_PATH"

echo "Building ust-inform-trade with BASE_PATH=$BASE_PATH ..."
pnpm prisma generate
rm -rf .next
pnpm next build
echo "Build completed."
