"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { JobsProvider } from "../../lib/jobs";
import { checkHealth } from "../../lib/api";

export function Shell({ children }: { children: ReactNode }) {
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [bump, setBump] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    checkHealth().then((ok) => {
      if (alive) setBackendOk(ok);
    });
    const t = setInterval(() => {
      checkHealth().then((ok) => alive && setBackendOk(ok));
    }, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [bump]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileMenuOpen]);

  return (
    <JobsProvider>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Desktop sidebar: always visible from lg up. */}
        <div className="hidden lg:flex">
          <Sidebar backendOk={backendOk} />
        </div>

        {/* Mobile drawer: hidden by default, slides in from left when toggled. */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden
            />
            <div className="relative h-full max-w-[260px] shadow-xl">
              <Sidebar
                backendOk={backendOk}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            onRefresh={() => setBump((b) => b + 1)}
            onMenuClick={() => setMobileMenuOpen(true)}
          />
          <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </JobsProvider>
  );
}
