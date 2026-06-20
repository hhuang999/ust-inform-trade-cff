import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import {
  FEATURED_GUIDE_SECTION,
  GUIDE_SECTIONS,
} from "@/lib/guide-content";

const ANIM = "animate-in fade-in slide-in-from-bottom-4 duration-500";

export default function GuideHubPage() {
  const featured = FEATURED_GUIDE_SECTION;
  const FeaturedIcon = featured.icon;
  // 其余章节(去掉置顶的「新手入门」)做功能导览卡片。
  const sections = GUIDE_SECTIONS.filter((s) => s.slug !== featured.slug);

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-primary-container/40 via-primary-container/15 to-transparent">
        <PageContainer className="flex flex-col items-center gap-5 py-16 text-center md:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant/50 bg-card/70 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
            <Sparkles className="size-3.5 text-primary" />
            新手上手指南
          </span>
          <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">
            玩转校园枢纽
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
            三分钟了解全部功能与每一处操作。无论你是否注册，都能在这里看清平台能为你做什么。
          </p>
          <div className="mt-1 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:justify-center">
            <Button asChild size="lg" className={ANIM}>
              <Link href={`/guide/${featured.slug}`}>
                从新手入门开始
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className={ANIM}>
              <Link href="/items">直接逛物品</Link>
            </Button>
          </div>
        </PageContainer>
      </section>

      <PageContainer className="space-y-10 py-10">
        {/* ── 快速开始(置顶章节) ── */}
        <Card className={`overflow-hidden ${ANIM}`}>
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:gap-5">
            <span
              className={`flex size-14 shrink-0 items-center justify-center rounded-xl ${featured.accent}`}
            >
              <FeaturedIcon className="size-7" />
            </span>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                快速开始
              </p>
              <CardTitle className="font-serif text-2xl">
                {featured.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{featured.tagline}</p>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link href={`/guide/${featured.slug}`}>
                查看详情
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="border-t border-outline-variant/40 pt-4">
            <ul className="grid gap-2 sm:grid-cols-2">
              {featured.steps?.map((step, i) => (
                <li key={step.title} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span>
                    <span className="font-medium text-foreground">
                      {step.title}
                    </span>
                    <span className="text-muted-foreground"> · {step.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* ── 功能导览 ── */}
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            <h2 className="font-serif text-2xl font-bold tracking-tight">
              功能导览
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((s, i) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.slug}
                  href={`/guide/${s.slug}`}
                  className={`group rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${ANIM}`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <Card className="h-full transition-shadow group-hover:shadow-float">
                    <CardHeader className="gap-3">
                      <span
                        className={`flex size-11 items-center justify-center rounded-lg ${s.accent}`}
                      >
                        <Icon className="size-5" />
                      </span>
                      <CardTitle className="font-serif text-lg">
                        {s.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {s.tagline}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary transition-transform group-hover:translate-x-0.5">
                        了解详情
                        <ArrowRight className="size-4" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── 结尾邀请 ── */}
        <div className="rounded-2xl border border-outline-variant/40 bg-card/50 px-6 py-8 text-center">
          <p className="font-serif text-lg font-semibold">准备好了吗？</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            浏览全部内容无需登录；登录后即可发布、交易、收藏，参与校园互助。
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/register">加入社区</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">登录</Link>
            </Button>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
