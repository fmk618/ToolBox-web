import type { Metadata } from "next";
import { Shell } from "../components/shell/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Toolbox — 通用文件格式转换",
  description: "PDF · Word · Markdown · HTML 一键互转 — 企业级中后台",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
