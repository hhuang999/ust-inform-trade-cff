"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { withBasePath } from "@/lib/base-path";
import { loginSchema } from "@/lib/validation/user";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "请输入账号和密码" };

  // 登录后回到来源页(若有);仅允许同源相对路径,防开放重定向。
  const rawCb = formData.get("callbackUrl");
  const callbackUrl =
    typeof rawCb === "string" && rawCb.startsWith("/") && !rawCb.startsWith("//")
      ? rawCb
      : "/";

  try {
    await signIn("credentials", {
      identifier: parsed.data.identifier,
      password: parsed.data.password,
      // Auth.js 回调路由的最终重定向是原生 HTTP 302,不应用 Next basePath;
      // 需手动带前缀,否则会落到平台根 / 而非 app 首页。
      redirectTo: withBasePath(callbackUrl),
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "邮箱/手机号或密码错误" };
    }
    throw e; // NEXT_REDIRECT,由框架处理
  }
  return {};
}
