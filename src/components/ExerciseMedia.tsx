"use client";

import { useEffect, useState } from "react";
import { ImageOff, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseMediaProps {
  frames: string[];
  alt: string;
  className?: string;
  /** Tự động luân phiên các khung hình (tắt nếu người dùng bật giảm chuyển động). */
  animate?: boolean;
}

const FRAME_MS = 1000;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export default function ExerciseMedia({
  frames,
  alt,
  className,
  animate = true,
}: ExerciseMediaProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(true);
  const [index, setIndex] = useState(0);
  const canAnimate = animate && frames.length > 1;
  const running = canAnimate && playing && !reducedMotion;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % frames.length), FRAME_MS);
    return () => clearInterval(id);
  }, [running, frames.length]);

  if (frames.length === 0) {
    return (
      <div
        className={cn(
          "bg-muted text-muted-foreground flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg text-sm",
          className,
        )}
      >
        <ImageOff className="size-8" aria-hidden />
        <span>Chưa có ảnh minh họa</span>
      </div>
    );
  }

  return (
    <div className={cn("bg-muted relative aspect-[4/3] overflow-hidden rounded-lg", className)}>
      {frames.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh đã tối ưu sẵn, cần chạy được khi static export
        <img
          key={src}
          src={src}
          alt={i === 0 ? alt : ""}
          aria-hidden={i !== 0}
          // Khung đầu thường là phần tử lớn nhất đầu trang (LCP) — tải ngay, ưu tiên cao.
          loading={i === 0 ? "eager" : "lazy"}
          fetchPriority={i === 0 ? "high" : "low"}
          decoding="async"
          className={cn(
            "absolute inset-0 size-full object-contain transition-opacity duration-300",
            i === index ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
      {canAnimate && (
        <button
          type="button"
          onClick={() => {
            if (reducedMotion) setIndex((i) => (i + 1) % frames.length);
            else setPlaying((p) => !p);
          }}
          className="bg-background/80 absolute right-2 bottom-2 flex size-11 items-center justify-center rounded-full shadow"
          aria-label={
            reducedMotion
              ? "Xem khung hình tiếp theo"
              : playing
                ? "Tạm dừng minh họa"
                : "Phát minh họa"
          }
        >
          {running ? <Pause className="size-5" /> : <Play className="size-5" />}
        </button>
      )}
    </div>
  );
}
