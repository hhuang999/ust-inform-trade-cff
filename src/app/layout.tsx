import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

// 字体全部使用 globals.css 里的系统字体栈,不引入任何远程字体。

export const metadata: Metadata = {
  title: {
    default: "校园枢纽 UniSwap · HKUST(GZ)",
    template: "%s · 校园枢纽 UniSwap",
  },
  description:
    "港科大（广州）校园二手物品交易与咨询服务匹配平台 —— 真实认证的校园社区，安全、可信、便捷。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
