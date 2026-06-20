import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, HelpCircle, Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { cn } from "@/lib/utils";
import {
  GUIDE_SECTIONS,
  getGuideSection,
  type GuideSection,
} from "@/lib/guide-content";

/** 预生成所有章节,避免无效 slug 走到渲染。 */
export function generateStaticParams() {
  return GUIDE_SECTIONS.map((s) => ({ section: s.slug }));
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  // 同步取 slug 即可;章节存在则给标题。
  return params.then((p) => {
    const section = getGuideSection(p.section);
    return section
      ? { title: `${section.title} · 用户指南` }
      : { title: "用户指南" };
  });
}

export default async function GuideSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section: slug } = await params;
  const section = getGuideSection(slug);
  if (!section) notFound();

  const Icon = section.icon;
  const others = GUIDE_SECTIONS.filter((s) => s.slug !== section.slug);

  return (
    <div className="flex flex-col">
      {/* ── 顶部章节横幅 ── */}
      <section className="bg-gradient-to-b from-primary-container/40 via-primary-container/15 to-transparent">
        <PageContainer className="space-y-5 py-10 md:py-14">
          <Link
            href="/guide"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            用户指南
          </Link>
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-xl shadow-sm",
                section.accent,
              )}
            >
              <Icon className="size-7" />
            </span>
            <div className="space-y-1">
              <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
                {section.title}
              </h1>
              <p className="text-sm text-muted-foreground md:text-base">
                {section.tagline}
              </p>
            </div>
          </div>
        </PageContainer>
      </section>

      <PageContainer className="grid gap-8 py-10 lg:grid-cols-[1fr_220px]">
        {/* ── 主体内容 ── */}
        <div className="min-w-0 space-y-10">
          {/* 概述 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold">概述</h2>
            <div className="space-y-3">
              {section.summary.map((p, i) => (
                <p key={i} className="leading-7 text-foreground/85">
                  {p}
                </p>
              ))}
            </div>
          </section>

          {/* 如何使用 */}
          {section.steps?.length ? (
            <section className="space-y-4">
              <h2 className="font-serif text-xl font-semibold">如何使用</h2>
              <ol className="space-y-3">
                {section.steps.map((step, i) => (
                  <li key={step.title}>
                    <Card>
                      <CardContent className="flex items-start gap-4 p-4">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif text-sm font-bold text-primary">
                          {i + 1}
                        </span>
                        <div className="space-y-1">
                          <p className="font-medium">{step.title}</p>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {step.body}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* 小贴士 */}
          {section.tips?.length ? (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-5 text-warning" />
                <h2 className="font-serif text-xl font-semibold">小贴士</h2>
              </div>
              <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
                <ul className="space-y-2.5">
                  {section.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm leading-6">
                      <ChevronRight className="mt-0.5 size-4 shrink-0 text-warning" />
                      <span className="text-foreground/85">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          {/* 常见问题 */}
          {section.faqs?.length ? (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="size-5 text-primary" />
                <h2 className="font-serif text-xl font-semibold">常见问题</h2>
              </div>
              <div className="space-y-3">
                {section.faqs.map((f, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-outline-variant/40 bg-card/40 p-4"
                  >
                    <p className="font-medium">Q · {f.q}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {f.a}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* ── 侧边:其他章节 ── */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-1">
            <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              本指南其他章节
            </p>
            {others.map((s) => (
              <SiblingLink key={s.slug} section={s} />
            ))}
            <Link
              href="/guide"
              className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              返回指南首页
            </Link>
          </div>
        </aside>

        {/* ── 移动端:底部其他章节 ── */}
        <div className="lg:hidden">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            继续阅读
          </p>
          <div className="flex flex-wrap gap-2">
            {others.map((s) => (
              <Link
                key={s.slug}
                href={`/guide/${s.slug}`}
                className="rounded-full border border-outline-variant/50 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-muted"
              >
                {s.title}
              </Link>
            ))}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

/** 侧边章节链接。详情页只列其他章节,故恒为可点。 */
function SiblingLink({ section }: { section: GuideSection }) {
  const Icon = section.icon;
  return (
    <Link
      href={`/guide/${section.slug}`}
      className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{section.title}</span>
    </Link>
  );
}
