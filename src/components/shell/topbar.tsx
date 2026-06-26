"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";
import { getTool } from "../../lib/tools/manifest";
import { ThemeToggle } from "./theme-toggle";
import { WechatButton } from "./wechat-button";

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
        <ThemeToggle />
        <WechatButton />
      </div>
    </header>
  );
}
