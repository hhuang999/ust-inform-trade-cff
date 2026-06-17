import type { NextConfig } from "next";

/**
 * 沙箱路径前缀(仅 boxset 分支用于校园部署沙箱)。
 *
 * 平台把 /apps/<应用名>/* 反代到本服务,应用名由平台分配、不固定。
 * 这里从 BASE_PATH 环境变量读取前缀(形如 /apps/myapp),交给 Next.js 原生 basePath:
 *   - 入站:平台保留前缀转发,Next 自动剥离 basePath 后再路由(无需自写 middleware)。
 *   - 出站:<Link>/router/server action/_next 静态资源自动带前缀。
 * 本地或常规部署(BASE_PATH 未设)时 basePath 为空,行为与主干一致。
 *
 * 注意:不要用「middleware 剥前缀 + <base href>」方案 —— <base> 只对相对路径生效,
 * 而 Next 生成的是根相对链接(/foo),<base> 不会为其拼前缀,会导致资源/链接 404。
 */
const basePath = process.env.BASE_PATH || undefined;

const nextConfig: NextConfig = {
  // 仅当显式设置 BASE_PATH 时才启用 basePath(否则保持默认空前缀)。
  ...(basePath ? { basePath } : {}),
  // 把前缀内联到客户端,供少数原生 fetch("/api/...") 用 withBasePath() 手动拼接。
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath ?? "",
  },
};

export default nextConfig;
