"use client";

import { useActionState, useState } from "react";
import { submitVerificationAction, type SubmitState } from "./actions";

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
    <div className="max-w-lg space-y-4 p-6">
      <h1 className="text-xl font-semibold">设置</h1>
      <p>认证状态:<strong>{verificationStatus}</strong></p>

      <form action={formAction} className="space-y-2 border-t pt-4">
        <h2 className="font-medium">学生证认证</h2>
        <input type="file" accept="image/*" multiple onChange={handleFile} />
        <input type="hidden" name="photoKeys" value={keys.join(",")} />
        {state.error && <p className="text-red-600">{state.error}</p>}
        {state.ok && <p className="text-green-600">已提交,等待审核。</p>}
        <button type="submit" className="rounded bg-black p-2 text-white">提交认证</button>
      </form>
    </div>
  );
}
