import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-24">
      {/* Ambient brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, hsl(243 75% 59% / 0.16), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(243 75% 59% / 0.4), transparent)",
        }}
      />

      <div className="flex w-full max-w-2xl flex-col items-center text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          港科大（广州）校园社区
        </span>

        <h1 className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
          校园信息流转平台
        </h1>

        <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          真实认证的校园二手物品交易与咨询服务匹配。
          连接同学，让闲置流转，让技能变现。
        </p>

        <div className="mt-9 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand px-6 text-sm font-medium text-brand-fg shadow-sm transition-colors hover:bg-brand-strong sm:w-auto"
          >
            立即注册
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-border bg-card px-6 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted sm:w-auto"
          >
            登录
          </Link>
        </div>
      </div>
    </main>
  );
}
