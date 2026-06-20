"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, GraduationCap, LogIn, Lock, Mail } from "lucide-react";

import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});
  const [showPassword, setShowPassword] = useState(false);
  const toasted = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (state.error && toasted.current !== state.error) {
      toasted.current = state.error;
      toast.error(state.error);
    }
  }, [state.error]);

  return (
    <Card className="w-full max-w-md border-outline-variant/40 shadow-float">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <GraduationCap className="size-6" />
        </div>
        <CardTitle className="font-serif text-2xl">欢迎回来</CardTitle>
        <CardDescription>登录校园信息流转平台</CardDescription>
      </CardHeader>

      <CardContent>
        {/* 带 callbackUrl 进来 = 访客点了需要登录的功能,给一句提示把"登录门槛"变成"功能邀请"。 */}
        {callbackUrl ? (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs leading-5 text-foreground/80">
            <LogIn className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span>
              登录后即可继续使用该功能。还没有账号?可在下方
              <Link
                href="/register"
                className="mx-0.5 font-medium text-primary hover:underline"
              >
                立即注册
              </Link>
              ,开启校园交易与互助的全部能力。
            </span>
          </div>
        ) : null}

        <form action={formAction} className="space-y-5">
          {callbackUrl ? (
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
          ) : null}
          <Field label="邮箱或手机号" htmlFor="identifier">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="identifier"
                name="identifier"
                placeholder="you@ust.hk 或 13800000000"
                autoComplete="username"
                className="pl-9"
                aria-invalid={Boolean(state.error) || undefined}
              />
            </div>
          </Field>

          <Field label="密码" htmlFor="password" error={state.error}>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••"
                autoComplete="current-password"
                className="px-9"
                aria-invalid={Boolean(state.error) || undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "隐藏密码" : "显示密码"}
                className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>

          <Button
            type="submit"
            size="lg"
            className="w-full active:scale-[0.98]"
          >
            登录
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            还没有账号?
            <Link
              href="/register"
              className="ml-1 font-medium text-primary hover:underline"
            >
              立即注册
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
