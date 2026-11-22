import type { MeasureType, SessionItem } from "@/content/schema";

type Target = Pick<SessionItem, "sets" | "repsMin" | "repsMax" | "secondsMin" | "secondsMax">;

function range(min: number, max: number): string {
  return min === max ? String(min) : `${min}–${max}`;
}

/** "3 × 8–12 lần", "3 × 8–12 lần mỗi bên", "3 × 20–40 giây". */
export function formatTarget(target: Target, measure: MeasureType): string {
  if (measure === "time") {
    if (target.secondsMin === undefined || target.secondsMax === undefined)
      return `${target.sets} hiệp`;
    return `${target.sets} × ${range(target.secondsMin, target.secondsMax)} giây`;
  }
  if (target.repsMin === undefined || target.repsMax === undefined) return `${target.sets} hiệp`;
  const suffix = measure === "reps_each_side" ? " lần mỗi bên" : " lần";
  return `${target.sets} × ${range(target.repsMin, target.repsMax)}${suffix}`;
}

/** 90 → "1 phút 30 giây", 60 → "1 phút", 45 → "45 giây". */
export function formatRest(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} giây`;
  return s === 0 ? `${m} phút` : `${m} phút ${s} giây`;
}
