import Link from "next/link";
import { HandHeart, ShieldCheck, Sparkles } from "lucide-react";

import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiteHeader } from "@/components/layout/site-header";
import { PageContainer } from "@/components/layout/page-container";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "真实身份认证",
    body: "学籍核验 + 实名背书，让每一次交易都有据可依、安心可靠。",
  },
  {
    icon: Sparkles,
    title: "安全撮合",
    body: "物品、服务、需求分类聚合，消息留痕，撮合过程清晰可追踪。",
  },
  {
    icon: HandHeart,
    title: "校内互助",
    body: "连接同学，让闲置流转，让技能变现，共建温暖的校园社区。",
  },
];

export default async function Home() {
  const session = await auth();
  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        role: session.user.role,
      }
    : null;
  const nickname = session?.user?.name;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user} />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary-container/40 via-primary-container/15 to-transparent">
          <PageContainer className="flex flex-col items-center gap-6 py-20 text-center md:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant/50 bg-card/70 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              <span className="size-1.5 rounded-full bg-primary" />
              港科大（广州）校园社区
            </span>

            <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">
              {nickname ? `欢迎回来，${nickname}` : "校园枢纽"}
            </h1>
            <p className="text-sm font-medium uppercase tracking-widest text-primary/80">
              港科大（广州）
            </p>

            <p className="max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
              真实认证的校园二手物品交易与咨询服务匹配平台。
              连接同学，让闲置流转，让技能变现。
            </p>

            <div className="mt-2 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href="/register">加入社区</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/items">浏览物品</Link>
              </Button>
            </div>
          </PageContainer>
        </section>

        {/* Features */}
        <PageContainer className="py-16">
          <div className="grid gap-5 sm:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title} className="items-start">
                  <CardHeader>
                    <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <CardTitle className="font-serif text-lg">
                      {f.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {f.body}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </PageContainer>

        {/* Footer line */}
        <PageContainer className="py-10">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} 校园枢纽 · 港科大（广州）· 校内互助，让信息流转
          </p>
        </PageContainer>
      </main>
    </div>
  );
}
