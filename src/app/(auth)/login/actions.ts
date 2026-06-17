"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
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
      // 登录后回到来源页 callbackUrl(已在上方做同源校验防开放重定向)。
      redirectTo: callbackUrl,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "邮箱/手机号或密码错误" };
    }
    throw e; // NEXT_REDIRECT,由框架处理
  }
  return {};
}
