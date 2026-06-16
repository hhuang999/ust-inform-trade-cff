"use client";

import { useActionState } from "react";
import { registerAction, type RegisterState } from "./actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const [state, formAction] = useActionState<RegisterState, FormData>(registerAction, {});

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>创建账号</CardTitle>
        <p className="text-sm text-muted-foreground">加入校园信息流转平台</p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          {state.error && (
            <p className="rounded-lg bg-rejected-soft px-3 py-2 text-sm text-rejected">
              {state.error}
            </p>
          )}

          {/* 账号 */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              账号
            </h2>
            <Field label="邮箱" hint="与手机号二选一">
              <Input name="email" type="email" placeholder="you@ust.hk" />
            </Field>
            <Field label="手机号" hint="与邮箱二选一">
              <Input name="phone" placeholder="13800000000" />
            </Field>
            <Field label="密码" hint="至少 6 位">
              <Input name="password" type="password" placeholder="••••••" />
            </Field>
          </div>

          {/* 学生身份 */}
          <div className="space-y-4 border-t border-border pt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              学生身份
            </h2>
            <Field label="真实姓名">
              <Input name="realName" placeholder="张三" />
            </Field>
            <Field label="学号">
              <Input name="studentId" placeholder="学号" />
            </Field>
            <Field label="院系">
              <Input name="department" placeholder="所在院系" />
            </Field>
            <Field label="入学年份">
              <Input
                name="enrollmentYear"
                type="number"
                placeholder="2024"
              />
            </Field>
          </div>

          {/* 个人资料 */}
          <div className="space-y-4 border-t border-border pt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              个人资料
            </h2>
            <Field label="昵称">
              <Input name="nickname" placeholder="展示给其他同学的昵称" />
            </Field>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="realNameVisible"
                className="h-4 w-4 rounded border-input text-brand focus-visible:ring-ring"
              />
              公开真实姓名
            </label>
          </div>

          <Button type="submit" size="lg" className="w-full">
            注册并登录
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            已有账号?
            <Link href="/login" className="ml-1 font-medium text-brand hover:underline">
              登录
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
