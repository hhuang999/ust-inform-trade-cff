"use client";

import { useMemo, useRef, useState } from "react";
import { useActionState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, GraduationCap, Mail, Phone } from "lucide-react";

import { registerAction, type RegisterState } from "./actions";
import { registerSchema } from "@/lib/validation/user";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FieldErrors = Partial<
  Record<
    | "email"
    | "phone"
    | "password"
    | "realName"
    | "studentId"
    | "department"
    | "enrollmentYear"
    | "nickname",
    string
  >
>;

export default function RegisterForm() {
  const [state, formAction] = useActionState<RegisterState, FormData>(
    registerAction,
    {}
  );
  const [showPassword, setShowPassword] = useState(false);
  const [realNameVisible, setRealNameVisible] = useState(false);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const toasted = useRef<string | undefined>(undefined);

  // Server errors often surface as a single top-level message; surface via toast.
  useEffect(() => {
    if (state.error && toasted.current !== state.error) {
      toasted.current = state.error;
      toast.error(state.error);
    }
  }, [state.error]);

  const passwordHint = useMemo(() => {
    if (!showPassword) return "至少 6 位";
    return undefined;
  }, [showPassword]);

  function validate(form: HTMLFormElement): FieldErrors {
    const data = new FormData(form);
    const enrollment = Number(data.get("enrollmentYear"));
    const parsed = registerSchema.safeParse({
      email: (data.get("email") as string) || undefined,
      phone: (data.get("phone") as string) || undefined,
      password: data.get("password"),
      realName: data.get("realName"),
      studentId: data.get("studentId"),
      department: data.get("department"),
      enrollmentYear: Number.isNaN(enrollment) ? undefined : enrollment,
      nickname: data.get("nickname"),
      realNameVisible: data.get("realNameVisible") === "on",
    });
    if (parsed.success) return {};
    const errors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof FieldErrors | undefined;
      if (key && !errors[key]) errors[key] = issue.message;
    }
    return errors;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const errors = validate(e.currentTarget);
    setClientErrors(errors);
    if (Object.keys(errors).length > 0) {
      e.preventDefault();
      toast.error("请检查表单填写");
    }
    // else: let the server action proceed
  }

  return (
    <div className="grid w-full max-w-2xl overflow-hidden rounded-xl border border-outline-variant/40 bg-card shadow-float md:grid-cols-2">
      {/* Brand panel (md+) */}
      <aside className="hidden flex-col justify-between bg-primary-container/40 p-8 md:flex">
        <div>
          <div className="mb-6 flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="size-6" />
          </div>
          <h2 className="font-serif text-2xl text-foreground">加入校园信息流转</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            买卖物品、发布服务、撮合需求 —— 一个干净温暖的校园集市。
          </p>
        </div>
        <ul className="space-y-3 text-sm text-foreground/80">
          {["真实身份核验,交易更安心", "秒级发布,纸感界面清爽舒适", "按院系/标签精准触达同学"].map(
            (item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            )
          )}
        </ul>
      </aside>

      {/* Form side */}
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">创建账号</CardTitle>
          <CardDescription>填写以下信息,加入平台</CardDescription>
        </CardHeader>

        <CardContent>
          <form action={formAction} onSubmit={handleSubmit} className="space-y-7">
            {/* 账号信息 */}
            <section className="space-y-4">
              <h3 className="font-serif text-base font-semibold text-foreground">
                账号信息
              </h3>
              <Field
                label="邮箱"
                htmlFor="email"
                hint="与手机号二选一"
                error={clientErrors.email}
              >
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@ust.hk"
                    className="pl-9"
                    aria-invalid={Boolean(clientErrors.email) || undefined}
                  />
                </div>
              </Field>
              <Field
                label="手机号"
                htmlFor="phone"
                hint="与邮箱二选一"
                error={clientErrors.phone}
              >
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="13800000000"
                    className="pl-9"
                    aria-invalid={Boolean(clientErrors.phone) || undefined}
                  />
                </div>
              </Field>
              <Field
                label="密码"
                htmlFor="password"
                hint={clientErrors.password ? undefined : passwordHint}
                error={clientErrors.password}
              >
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••"
                    className="pr-9"
                    aria-invalid={Boolean(clientErrors.password) || undefined}
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
            </section>

            {/* 真实身份 */}
            <section className="space-y-4 border-t border-outline-variant/40 pt-5">
              <h3 className="font-serif text-base font-semibold text-foreground">
                真实身份
              </h3>
              <Field label="真实姓名" htmlFor="realName" error={clientErrors.realName}>
                <Input
                  id="realName"
                  name="realName"
                  placeholder="张三"
                  aria-invalid={Boolean(clientErrors.realName) || undefined}
                />
              </Field>
              <Field label="学号" htmlFor="studentId" error={clientErrors.studentId}>
                <Input
                  id="studentId"
                  name="studentId"
                  placeholder="学号"
                  aria-invalid={Boolean(clientErrors.studentId) || undefined}
                />
              </Field>
              <Field label="院系" htmlFor="department" error={clientErrors.department}>
                <Input
                  id="department"
                  name="department"
                  placeholder="所在院系"
                  aria-invalid={Boolean(clientErrors.department) || undefined}
                />
              </Field>
              <Field
                label="入学年份"
                htmlFor="enrollmentYear"
                error={clientErrors.enrollmentYear}
              >
                <Input
                  id="enrollmentYear"
                  name="enrollmentYear"
                  type="number"
                  placeholder="2024"
                  aria-invalid={Boolean(clientErrors.enrollmentYear) || undefined}
                />
              </Field>
            </section>

            {/* 选填 */}
            <section className="space-y-4 border-t border-outline-variant/40 pt-5">
              <h3 className="font-serif text-base font-semibold text-foreground">
                选填
              </h3>
              <Field label="昵称" htmlFor="nickname" error={clientErrors.nickname}>
                <Input
                  id="nickname"
                  name="nickname"
                  placeholder="展示给其他同学的昵称"
                  aria-invalid={Boolean(clientErrors.nickname) || undefined}
                />
              </Field>
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">公开真实姓名</p>
                  <p className="text-xs text-muted-foreground">
                    关闭时仅对你自己可见
                  </p>
                </div>
                <Switch
                  checked={realNameVisible}
                  onCheckedChange={setRealNameVisible}
                  aria-label="公开真实姓名"
                />
              </div>
              {/* Radix Switch does not submit a form field, so keep a hidden
                  checkbox synced to the switch state (action reads === "on").
                  Unchecked checkboxes are not submitted, so the action falls
                  back to false — matching the existing "==="on"" logic. */}
              <input
                type="checkbox"
                name="realNameVisible"
                checked={realNameVisible}
                readOnly
                className="hidden"
              />
            </section>

            <Button type="submit" size="lg" className="w-full active:scale-[0.98]">
              注册并登录
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              已有账号?
              <Link
                href="/login"
                className="ml-1 font-medium text-primary hover:underline"
              >
                登录
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
