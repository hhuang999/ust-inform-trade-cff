"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, MessageSquare, Send } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatNoticeTime } from "@/lib/time";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { sendMessage } from "@/app/(app)/messages/actions";
import { MESSAGE_BODY_MAX } from "@/lib/constants/message";

export interface ThreadMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface MessageThreadProps {
  contextType: "ITEM" | "SERVICE" | "NEED";
  contextId: string;
  viewerId: string;
  otherUserId: string;
  otherNickname: string;
  initialMessages: ThreadMessage[];
}

/**
 * 详情页"沟通留言"区(共享于物品/服务/需求)。
 * 不做独立聊天窗:仅展示当前用户与 otherUser 在该上下文上的会话 + 输入框。
 * 发送成功后乐观追加到本地列表(服务端 revalidate 保证离开/重进时数据一致)。
 */
export function MessageThread({
  contextType,
  contextId,
  viewerId,
  otherUserId,
  otherNickname,
  initialMessages,
}: MessageThreadProps) {
  const [pending, startTransition] = useTransition();
  const [messages, setMessages] =
    React.useState<ThreadMessage[]>(initialMessages);
  const [body, setBody] = React.useState("");
  const endRef = React.useRef<HTMLDivElement>(null);

  // 新消息到达时滚到底部。
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  function handleSend() {
    const trimmed = body.trim();
    if (!trimmed || pending) return;
    if (trimmed.length > MESSAGE_BODY_MAX) {
      toast.error(`留言最多 ${MESSAGE_BODY_MAX} 字`);
      return;
    }
    startTransition(async () => {
      const res = await sendMessage({
        contextType,
        contextId,
        recipientId: otherUserId,
        body: trimmed,
      });
      if (res.ok) {
        // 乐观追加(临时 id);服务端 revalidate 保证下次进入页面时数据一致。
        setMessages((prev) => [
          ...prev,
          {
            id: `local-${crypto.randomUUID()}`,
            senderId: viewerId,
            body: trimmed,
            createdAt: new Date().toISOString(),
          },
        ]);
        setBody("");
        toast.success("已发送");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card id="messages" className="scroll-mt-20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="size-4 text-primary" />
          沟通留言
          <Badge variant="secondary" className="font-normal">
            与 {otherNickname}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex max-h-80 flex-col gap-2 overflow-y-auto rounded-lg border border-outline-variant/40 bg-accent/30 p-3">
          {messages.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              暂无留言,发条消息开始沟通吧。
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.senderId === viewerId;
              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    mine ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                      mine
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-card text-foreground ring-1 ring-inset ring-outline-variant/40"
                    )}
                  >
                    <p className="whitespace-pre-line break-words">{m.body}</p>
                    <p
                      className={cn(
                        "mt-0.5 text-[10px] tabular-nums",
                        mine ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {formatNoticeTime(m.createdAt, new Date())}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        <div className="space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`给 ${otherNickname} 留言…`}
            rows={2}
            maxLength={MESSAGE_BODY_MAX}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs tabular-nums text-muted-foreground">
              {body.length}/{MESSAGE_BODY_MAX}
            </span>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={pending || !body.trim()}
            >
              {pending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Send />
              )}
              发送
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
