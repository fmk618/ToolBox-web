import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Shell } from "../components/shell/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Toolbox — 工具百宝箱",
  description: "工具百宝箱 — 常用小工具集合，全部本地运行，按 ⌘K 快速搜索",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-CN"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Apply saved theme before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('toolbox.theme');if(t==='dark')document.documentElement.classList.add('dark');else if(t==='light')document.documentElement.classList.add('light');})();`,
          }}
        />
      </head>
      <body className="min-h-full bg-background font-sans text-foreground">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
