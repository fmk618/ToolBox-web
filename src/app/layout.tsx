import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
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
    <html
      lang="zh-CN"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
