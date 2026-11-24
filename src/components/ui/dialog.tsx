"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Hộp thoại dựa trên <dialog> của trình duyệt: có sẵn bẫy focus, phím Esc và lớp nền. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="dialog-title"
      className={cn(
        "bg-background text-foreground m-auto w-[min(28rem,calc(100%-2rem))] rounded-xl p-5 shadow-xl backdrop:bg-black/50",
        className,
      )}
    >
      <h2 id="dialog-title" className="mb-3 text-lg font-semibold">
        {title}
      </h2>
      {children}
    </dialog>
  );
}
