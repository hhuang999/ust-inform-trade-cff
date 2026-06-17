"use server";

import { signOut } from "@/lib/auth";
import { withBasePath } from "@/lib/base-path";

/**
 * 登出(server action)。
 *
 * 必须用服务端 signOut,而不是 `next-auth/react` 的客户端 signOut:
 * 后者不感知 Next.js basePath,在子路径部署(如 /apps/<app>)下会 POST 到
 * /api/auth/signout(真实路径是 /apps/<app>/api/auth/signout),请求落空 →
 * session cookie 不会被清除 → 用户"登出"后下次进来仍是登录态。
 *
 * 服务端 signOut 会正确清除 cookie(path 对齐)并重定向。
 * 登出后回到 app 首页(与登录后一致)。redirectTo 需手动带 basePath 前缀:
 * Auth.js 回调路由的最终重定向是原生 HTTP 302,不应用 Next basePath。
 */
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: withBasePath("/") });
}
