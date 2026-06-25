"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPaletteProvider } from "./command-palette";
import { JobsProvider } from "../../lib/jobs";
import { usePathname } from "next/navigation";

export function Shell({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [offline, setOffline] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const h = () => setOffline(!navigator.onLine);
    window.addEventListener("online", h);
    window.addEventListener("offline", h);
    setOffline(!navigator.onLine);
    return () => {
      window.removeEventListener("online", h);
      window.removeEventListener("offline", h);
    };
  }, []);

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
      <CommandPaletteProvider>
        <div className="flex min-h-screen bg-background text-foreground">
          <div className="hidden lg:flex">
            <Sidebar />
          </div>

          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
                aria-hidden
              />
              <div className="relative h-full max-w-[260px] shadow-xl">
                <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
              </div>
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            {offline && (
              <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-center text-xs text-amber-700 dark:text-amber-300">
                已离线 · 本地工具仍可使用，文件转换功能不可用
              </div>
            )}
            <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
            <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </CommandPaletteProvider>
    </JobsProvider>
  );
}
