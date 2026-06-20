"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CONTENT_MAX,
  FEEDBACK_CONTACT_MAX,
} from "@/lib/constants/feedback";
import { createFeedback } from "./actions";

export function FeedbackForm() {
  const [category, setCategory] = useState<string>("BUG");
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createFeedback({ category, content, contact });
      if (res.ok) {
        toast.success("感谢反馈!我们已收到你的意见。");
        setDone(true);
        setContent("");
        setContact("");
      } else {
        toast.error(res.error);
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-xl border border-outline-variant/40 bg-card p-6 text-center">
        <p className="font-medium text-foreground">反馈已提交,感谢支持!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          开发者会在「管理后台 · 用户反馈」看到你的意见,必要时通过站内通知回复你。
        </p>
        <Button variant="outline" className="mt-4" onClick={() => setDone(false)}>
          再写一条
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">反馈类型</label>
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_CATEGORIES.map((c) => {
            const active = category === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={
                  "rounded-full border px-3 py-1 text-sm transition-colors " +
                  (active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-outline-variant text-muted-foreground hover:text-foreground")
                }
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium">
          反馈内容
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            ({content.length}/{FEEDBACK_CONTENT_MAX})
          </span>
        </label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="遇到的问题、改进建议……请尽量描述清楚(必填)"
          rows={6}
          maxLength={FEEDBACK_CONTENT_MAX}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium">
          联系方式
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            (选填,便于我们回复你)
          </span>
        </label>
        <Input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="微信 / 手机号 / 邮箱"
          maxLength={FEEDBACK_CONTACT_MAX}
        />
      </div>

      <Button type="submit" disabled={pending || content.trim().length === 0}>
        {pending ? <Loader2 className="animate-spin" /> : <Send />}
        提交反馈
      </Button>
    </form>
  );
}
