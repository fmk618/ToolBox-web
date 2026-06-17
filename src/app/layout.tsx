import type { Metadata } from "next";
import { Shell } from "../components/shell/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Toolbox — 开发者工具集",
  description: "常用开发者小工具集合，全部本地运行",
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
