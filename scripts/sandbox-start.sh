#!/usr/bin/env bash
# 沙箱启动脚本(仅 boxset 分支)。
#
# 平台规则:
#   1) 反代把 /apps/<应用名>/* 转发到 0.0.0.0:3000;应用名由平台分配、不固定。
#   2) 应用须监听 0.0.0.0:3000。
#   3) /mydata/ 是唯一持久化路径,沙箱重建后仅此目录保留。
set -euo pipefail

# 1) 从持久化 /mydata/.env 读取环境(BASE_PATH 与生产凭证)。
#    换沙箱 / 改应用名时,只改 /mydata/.env 里的 BASE_PATH=/apps/<新名>,无需改代码。
ENV_FILE="${MYDATA_ENV:-/mydata/.env}"
if [ -f "$ENV_FILE" ]; then
  set -a; . "$ENV_FILE"; set +a
else
  echo "[sandbox-start] 未找到 $ENV_FILE,使用进程已具备的环境变量。" >&2
fi

# 2) 路径前缀:未设置则以根路径运行(本地 / 未配前缀)。
export BASE_PATH="${BASE_PATH:-}"

# 3) 安装 -> 构建 -> 启动。显式绑定 0.0.0.0:3000(平台反代要求)。
#    用 pnpm exec next start 直接传参(pnpm run start -- 在 Next 16 下会把 -H 当成目录参数)。
pnpm install --frozen-lockfile || pnpm install
# 同步数据库 schema:应用未执行的迁移(幂等、非破坏性)。失败不阻断启动。
pnpm prisma migrate deploy || echo "[sandbox-start] prisma migrate deploy 跳过/失败,继续"
pnpm build
exec pnpm exec next start -H 0.0.0.0 -p 3000
