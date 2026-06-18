"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";
import type { SVGProps } from "react";
import { getTool } from "../../lib/tools/manifest";
import { WechatButton } from "./wechat-button";

function GitHubMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden {...props}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const params = useParams<{ slug?: string }>();
  const tool = params?.slug ? getTool(params.slug) : undefined;

  const isHome = pathname === "/";
  const title = isHome ? "所有工具" : (tool?.name ?? "未知工具");

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/80 px-3 py-3 backdrop-blur-md sm:px-6 sm:py-4">
      <div className="flex min-w-0 items-start gap-2 sm:gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="-ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="打开菜单"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0">
          <nav className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
            <Link href="/" className="hover:text-foreground transition-colors">
              Toolbox
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground/80">{title}</span>
          </nav>
          <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:mt-1 sm:text-lg">
            {title}
          </h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <WechatButton />
        <a
          href="https://github.com/fmk618/ToolBox"
          target="_blank"
          rel="noopener noreferrer"
          className="grid h-9 w-9 place-items-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="GitHub"
          aria-label="GitHub"
        >
          <GitHubMark className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}
