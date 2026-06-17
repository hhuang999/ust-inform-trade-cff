"use server";

import { signOut } from "@/lib/auth";

/**
 * 登出(server action)。
 *
 * 必须用服务端 signOut,而不是 `next-auth/react` 的客户端 signOut:
 * 后者不感知 Next.js basePath,在子路径部署(如 /apps/<app>)下会 POST 到
 * /api/auth/signout(真实路径是 /apps/<app>/api/auth/signout),请求落空 →
 * session cookie 不会被清除 → 用户"登出"后下次进来仍是登录态。
 *
 * 服务端 signOut 会正确清除 cookie(path 对齐)并重定向到登录页。
 */
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
