"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";

export default function LoginPage() {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="w-full max-w-md space-y-3 rounded-lg border p-6">
      <h1 className="text-xl font-semibold">登录</h1>
      {state.error && <p className="text-red-600">{state.error}</p>}
      <input name="identifier" placeholder="邮箱或手机号" className="w-full border p-2" />
      <input name="password" type="password" placeholder="密码" className="w-full border p-2" />
      <button type="submit" className="w-full rounded bg-black p-2 text-white">登录</button>
      <p className="text-sm">
        没有账号?<Link href="/register" className="underline">注册</Link>
      </p>
    </form>
  );
}
