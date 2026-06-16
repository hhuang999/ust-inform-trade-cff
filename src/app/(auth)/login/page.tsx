"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>欢迎回来</CardTitle>
        <p className="text-sm text-muted-foreground">登录校园信息流转平台</p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <p className="rounded-lg bg-rejected-soft px-3 py-2 text-sm text-rejected">
              {state.error}
            </p>
          )}
          <Input name="identifier" placeholder="邮箱或手机号" autoComplete="username" />
          <Input
            name="password"
            type="password"
            placeholder="密码"
            autoComplete="current-password"
          />
          <Button type="submit" size="lg" className="w-full">
            登录
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            没有账号?
            <Link href="/register" className="ml-1 font-medium text-brand hover:underline">
              注册
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
