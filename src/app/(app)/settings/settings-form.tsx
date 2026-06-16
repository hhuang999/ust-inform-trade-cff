"use client";

import { useActionState, useState } from "react";
import { submitVerificationAction, type SubmitState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type VerificationStatus } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsForm({ verificationStatus }: { verificationStatus: string }) {
  const [keys, setKeys] = useState<string[]>([]);
  const [state, formAction] = useActionState<SubmitState, FormData>(submitVerificationAction, {});

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const uploaded: string[] = [];
    for (const file of files) {
      const { post, key } = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "student-id" }),
      }).then((r) => r.json());

      const form = new FormData();
      Object.entries(post.fields).forEach(([k, v]) => form.append(k, v as string));
      form.append("Content-Type", file.type); // 匹配 presign 的 starts-with image/ 条件
      form.append("file", file); // file 必须最后追加
      await fetch(post.url, { method: "POST", body: form });
      uploaded.push(key);
    }
    setKeys(uploaded);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">设置</h1>
        <p className="text-sm text-muted-foreground">管理你的账号与认证状态</p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm text-muted-foreground">当前认证状态</p>
          </div>
          <Badge status={verificationStatus as VerificationStatus} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">学生证认证</CardTitle>
          <p className="text-sm text-muted-foreground">
            上传清晰的学生证照片，提交后由管理员审核。
          </p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/40 px-4 py-8 text-center transition-colors hover:bg-muted">
                <svg
                  className="h-8 w-8 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-1.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <span className="text-sm font-medium text-foreground">点击选择图片</span>
                <span className="text-xs text-muted-foreground">
                  支持多张，仅限图片格式
                </span>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFile}
                  className="hidden"
                />
              </label>
              {keys.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  已选择 {keys.length} 张图片
                </p>
              )}
            </div>
            <input type="hidden" name="photoKeys" value={keys.join(",")} />
            {state.error && (
              <p className="rounded-lg bg-rejected-soft px-3 py-2 text-sm text-rejected">
                {state.error}
              </p>
            )}
            {state.ok && (
              <p className="rounded-lg bg-verified-soft px-3 py-2 text-sm text-verified">
                已提交，等待审核。
              </p>
            )}
            <Button type="submit" className="w-full">
              提交认证
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
