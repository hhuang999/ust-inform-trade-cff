import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

// 沙箱/离线环境无法访问 Google Fonts(fonts.gstatic.com 被屏蔽,构建期会失败),
// 因此不使用 next/font/google。字体改由 globals.css 的 :root 以系统字体栈定义
// (--font-geist-sans / --font-geist-mono / --font-serif-google),零远程字体、零字体文件。

export const metadata: Metadata = {
  title: {
    default: "校园枢纽 · HKUST(GZ)",
    template: "%s · 校园枢纽",
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
