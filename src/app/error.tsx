"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * 全局错误边界:捕获路由渲染/数据错误(如 Neon 冷启动偶发 500),
 * 渲染品牌化"加载失败 + 重新加载",而非 Next 默认错误页。
 * reset() 会重新渲染出错的路由段。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 便于线上排查(含 digest 关联服务端日志)。
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary-container/20 via-primary-container/5 to-transparent px-6 text-center">
      <p className="font-serif text-5xl font-bold text-primary md:text-6xl">
        加载失败
      </p>
      <h1 className="mt-4 font-serif text-xl font-semibold md:text-2xl">
        页面暂时无法加载
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        可能是网络抖动或服务暂时繁忙(例如数据库冷启动)。稍等片刻点「重新加载」通常即可恢复。
      </p>

      <Button onClick={reset} size="lg" className="mt-8">
        <RotateCcw />
        重新加载
      </Button>

      <p className="mt-12 text-xs text-muted-foreground">
        校园枢纽 UniSwap · HKUST（广州）
      </p>
    </main>
  );
}
