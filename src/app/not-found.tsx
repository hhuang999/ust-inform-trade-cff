import Link from "next/link";
import { Compass, HandHeart, Home, Package, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * 全局 404。项目无路由组级 not-found,所有未匹配路由与 notFound() 调用都落到这里。
 * 根 layout 不含 SiteHeader/AppSidebar,故本页做成自带品牌样式的独立落地页,
 * 提供明确出口,避免用户卡在 Next 默认的白底 404。
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary-container/30 via-primary-container/10 to-transparent px-6 text-center">
      <p className="font-serif text-7xl font-bold tabular-nums text-primary md:text-8xl">
        404
      </p>
      <h1 className="mt-5 font-serif text-2xl font-semibold md:text-3xl">
        页面走丢了
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        你访问的页面可能已被移动、改名，或从未存在。不妨从下面的入口重新出发。
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/">
            <Home />
            回首页
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/items">
            <Package />
            物品
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/services">
            <Wrench />
            服务
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/needs">
            <HandHeart />
            需求
          </Link>
        </Button>
      </div>

      <Link
        href="/guide"
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <Compass className="size-4" />
        第一次来？看看新手指南
      </Link>

      <p className="mt-12 text-xs text-muted-foreground">
        校园枢纽 · HKUST（广州）
      </p>
    </main>
  );
}
