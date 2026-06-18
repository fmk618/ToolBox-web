"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { SVGProps } from "react";
import { cn } from "../../lib/utils";

/** WeChat brand mark — two overlapping speech bubbles with eye dots, sourced from
 *  Simple Icons. Inlined because lucide-react v1 no longer ships brand glyphs.
 *  Uses `currentColor` so it inherits text color. */
function WechatMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 10.436 7.17c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177-.005-.017-.354-1.247-.354-1.247a.582.582 0 0 1 .207-.654c1.412-1.069 2.51-2.929 2.51-4.808 0-3.366-3.222-6.105-7.072-6.105zm-2.39 3.293c.535 0 .968.44.968.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982z" />
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
