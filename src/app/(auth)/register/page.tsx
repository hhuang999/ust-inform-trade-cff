"use client";

import { useActionState } from "react";
import { registerAction, type RegisterState } from "./actions";
import Link from "next/link";

export default function RegisterPage() {
  const [state, formAction] = useActionState<RegisterState, FormData>(registerAction, {});

  return (
    <form action={formAction} className="w-full max-w-md space-y-3 rounded-lg border p-6">
      <h1 className="text-xl font-semibold">注册</h1>
      {state.error && <p className="text-red-600">{state.error}</p>}
      <input name="email" type="email" placeholder="邮箱(与手机号二选一)" className="w-full border p-2" />
      <input name="phone" placeholder="手机号(与邮箱二选一)" className="w-full border p-2" />
      <input name="password" type="password" placeholder="密码(至少6位)" className="w-full border p-2" />
      <input name="realName" placeholder="真实姓名" className="w-full border p-2" />
      <input name="studentId" placeholder="学号" className="w-full border p-2" />
      <input name="department" placeholder="院系" className="w-full border p-2" />
      <input name="enrollmentYear" type="number" placeholder="入学年份" className="w-full border p-2" />
      <input name="nickname" placeholder="昵称" className="w-full border p-2" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="realNameVisible" /> 公开真实姓名
      </label>
      <button type="submit" className="w-full rounded bg-black p-2 text-white">注册并登录</button>
      <p className="text-sm">
        已有账号?<Link href="/login" className="underline">登录</Link>
      </p>
    </form>
  );
}
