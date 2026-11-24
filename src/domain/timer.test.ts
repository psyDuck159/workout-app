import { describe, expect, it } from "vitest";
import { formatClock, formatDuration, remainingMs } from "./timer";

describe("remainingMs", () => {
  it("tính từ mốc tuyệt đối, không âm", () => {
    expect(remainingMs(10_000, 4_000)).toBe(6_000);
    expect(remainingMs(10_000, 12_000)).toBe(0);
  });

  it("đúng sau khi tab bị tạm dừng 2 phút (không phụ thuộc số tick)", () => {
    const start = 1_000_000;
    const endsAt = start + 150_000; // nghỉ 2 phút 30 giây
    expect(remainingMs(endsAt, start + 120_000)).toBe(30_000);
  });
});

describe("formatClock", () => {
  it.each([
    [0, "0:00"],
    [300, "0:01"],
    [59_001, "1:00"],
    [65_000, "1:05"],
    [600_000, "10:00"],
  ])("%i ms → %s", (ms, text) => {
    expect(formatClock(ms)).toBe(text);
  });
});

describe("formatDuration", () => {
  it.each([
    [45_000, "45 giây"],
    [95_000, "1 phút 35 giây"],
    [120_000, "2 phút"],
    [1_830_000, "30 phút"],
  ])("%i ms → %s", (ms, text) => {
    expect(formatDuration(ms)).toBe(text);
  });
});
