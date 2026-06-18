"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { SVGProps } from "react";
import { cn } from "../../lib/utils";

/** WeChat brand mark (two stylised speech bubbles). Inlined because lucide-react v1
 *  no longer ships brand glyphs. Uses `currentColor` so it inherits text color. */
function WechatMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M8.667 11.85a.92.92 0 0 1-.943-.943.92.92 0 0 1 .943-.944.92.92 0 0 1 .943.944.92.92 0 0 1-.943.943m-3.59 0a.92.92 0 0 1-.944-.943.92.92 0 0 1 .944-.944.92.92 0 0 1 .943.944.92.92 0 0 1-.943.943M6.879 4C3.06 4 0 6.508 0 9.667c0 1.74.94 3.323 2.484 4.41l-.621 1.798 2.226-1.057c.642.157 1.302.236 1.964.236.124 0 .245-.004.367-.012a4.83 4.83 0 0 1-.21-1.395c0-2.954 2.704-5.342 6.034-5.342l.243.006C12.213 5.787 9.797 4 6.879 4M17.6 12.687a.79.79 0 0 1-.807-.807.79.79 0 0 1 .807-.806.79.79 0 0 1 .806.806.79.79 0 0 1-.806.807m-3.213 0a.79.79 0 0 1-.806-.807.79.79 0 0 1 .806-.806.79.79 0 0 1 .807.806.79.79 0 0 1-.807.807m6.508-3.295c0-2.612-2.61-4.74-5.844-4.74-3.291 0-5.927 2.128-5.927 4.74 0 2.615 2.636 4.74 5.927 4.74.689 0 1.366-.099 2.013-.291l1.847.917-.525-1.488c1.477-.92 2.509-2.298 2.509-3.878" />
    </svg>
  );
}

export function WechatButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [hasImage, setHasImage] = useState(true);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className={cn(
            "grid h-9 w-9 place-items-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            className,
          )}
          title="微信公众号"
          aria-label="微信公众号"
        >
          <WechatMark className="h-4 w-4" />
        </button>
      </Dialog.Trigger>

      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 4 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="fixed left-1/2 top-1/2 z-50 w-[88vw] max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-popover p-5 text-popover-foreground shadow-2xl"
              >
                <div className="mb-3 flex items-center justify-between">
                  <Dialog.Title className="text-sm font-semibold">
                    微信公众号
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="关闭"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Dialog.Close>
                </div>

                <Dialog.Description className="sr-only">
                  扫码关注微信公众号
                </Dialog.Description>

                <div className="grid place-items-center">
                  {hasImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src="/wechat-qr.png"
                      alt="微信公众号二维码"
                      onError={() => setHasImage(false)}
                      className="h-60 w-60 rounded-md border border-border object-contain"
                    />
                  ) : (
                    <div className="grid h-60 w-60 place-items-center rounded-md border-2 border-dashed border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                      <div>
                        <div className="mb-1.5 font-medium text-foreground">
                          替换二维码图片
                        </div>
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                          public/wechat-qr.png
                        </code>
                        <p className="mt-2 text-[11px] leading-relaxed">
                          把图片放到这个路径即可
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  扫一扫，关注公众号
                </p>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
