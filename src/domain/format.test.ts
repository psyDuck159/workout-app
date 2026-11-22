import { describe, expect, it } from "vitest";
import { formatRest, formatTarget } from "./format";

describe("formatTarget", () => {
  it("số lần", () => {
    expect(formatTarget({ sets: 3, repsMin: 8, repsMax: 12 }, "reps")).toBe("3 × 8–12 lần");
  });
  it("số lần mỗi bên", () => {
    expect(formatTarget({ sets: 3, repsMin: 10, repsMax: 10 }, "reps_each_side")).toBe(
      "3 × 10 lần mỗi bên",
    );
  });
  it("thời gian, kể cả khi mục tiêu có cả reps", () => {
    expect(
      formatTarget({ sets: 3, repsMin: 8, repsMax: 10, secondsMin: 20, secondsMax: 40 }, "time"),
    ).toBe("3 × 20–40 giây");
  });
  it("thiếu mục tiêu phù hợp thì chỉ hiện số hiệp", () => {
    expect(formatTarget({ sets: 2, repsMin: 8, repsMax: 10 }, "time")).toBe("2 hiệp");
  });
});

describe("formatRest", () => {
  it.each([
    [45, "45 giây"],
    [60, "1 phút"],
    [90, "1 phút 30 giây"],
    [150, "2 phút 30 giây"],
  ])("%i giây → %s", (s, text) => {
    expect(formatRest(s)).toBe(text);
  });
});
