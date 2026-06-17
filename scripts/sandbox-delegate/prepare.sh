#!/bin/bash
# Coze 平台契约:平台在 /mydata/projects 跑 `pnpm install`。
# 我们把真正的 app 放在 /mydata/ust-inform-trade-cff,这里委托过去。
set -Eeuo pipefail

APP_DIR=/mydata/ust-inform-trade-cff
cd "$APP_DIR"

echo "Installing dependencies (ust-inform-trade)..."
pnpm install --prefer-offline
