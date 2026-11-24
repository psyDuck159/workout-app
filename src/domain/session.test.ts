import { describe, expect, it } from "vitest";
import {
  currentPosition,
  initialPlayer,
  prefillValue,
  reducePlayer,
  summarize,
  type PlannedItem,
  type PlayerEvent,
  type PlayerState,
} from "./session";

const T = 1_000_000;

const plan: PlannedItem[] = [
  { exerciseId: "push-up", measure: "reps", sets: 2, repsMin: 8, repsMax: 12, restSec: 90 },
  { exerciseId: "plank", measure: "time", sets: 1, secondsMin: 20, secondsMax: 40, restSec: 60 },
  { exerciseId: "squat", measure: "reps", sets: 1, repsMin: 10, repsMax: 15, restSec: 60 },
];

const run = (events: PlayerEvent[], state: PlayerState = initialPlayer(plan)) =>
  events.reduce((s, e) => reducePlayer(s, plan, e), state);

describe("reducePlayer", () => {
  it("bắt đầu ở bài đầu tiên, hiệp đầu tiên", () => {
    const s = initialPlayer(plan);
    expect(s.phase).toEqual({ kind: "exercise", item: 0 });
    expect(currentPosition(s)).toEqual({ item: 0, set: 0 });
  });

  it("buổi rỗng thì kết thúc ngay", () => {
    expect(initialPlayer([]).phase).toEqual({ kind: "done" });
  });

  it("ghi hiệp chưa phải cuối → nghỉ theo restSec rồi quay lại cùng bài", () => {
    const s = run([{ type: "logSet", now: T }]);
    expect(s.phase).toEqual({ kind: "rest", item: 0, endsAt: T + 90_000 });
    expect(s.items[0].done).toBe(1);
    expect(currentPosition(run([{ type: "restElapsed" }], s))).toEqual({ item: 0, set: 1 });
  });

  it("ghi hiệp cuối của bài → nghỉ rồi sang bài kế, kèm bài vừa xong để đánh giá", () => {
    const s = run([
      { type: "logSet", now: T },
      { type: "skipRest" },
      { type: "logSet", now: T + 1 },
    ]);
    expect(s.phase).toEqual({ kind: "rest", item: 1, endsAt: T + 1 + 90_000, finishedItem: 0 });
  });

  it("ghi hiệp cuối của bài cuối → kết thúc, không nghỉ", () => {
    const s = run([
      { type: "logSet", now: T },
      { type: "skipRest" },
      { type: "logSet", now: T },
      { type: "skipRest" },
      { type: "logSet", now: T },
      { type: "skipRest" },
      { type: "logSet", now: T },
    ]);
    expect(s.phase).toEqual({ kind: "done" });
    expect(s.items.map((i) => i.done)).toEqual([2, 1, 1]);
  });

  it("chỉnh giờ nghỉ ±15 giây nhưng không về trước thời điểm hiện tại", () => {
    const s = run([{ type: "logSet", now: T }]);
    const longer = run([{ type: "adjustRest", deltaMs: 15_000, now: T }], s);
    expect(longer.phase).toMatchObject({ endsAt: T + 105_000 });
    const shorter = run([{ type: "adjustRest", deltaMs: -200_000, now: T + 10 }], s);
    expect(shorter.phase).toMatchObject({ endsAt: T + 10 });
  });

  it("bỏ qua bài → sang bài kế ngay, không nghỉ", () => {
    const s = run([{ type: "skipExercise" }]);
    expect(s.items[0].skipped).toBe(true);
    expect(s.phase).toEqual({ kind: "exercise", item: 1 });
  });

  it("báo đau → đánh dấu bài và sang bài kế; báo đau ở bài cuối thì kết thúc", () => {
    const s = run([{ type: "reportPain" }]);
    expect(s.items[0].pain).toBe(true);
    expect(s.phase).toEqual({ kind: "exercise", item: 1 });
    const end = run([{ type: "skipExercise" }, { type: "skipExercise" }, { type: "reportPain" }]);
    expect(end.phase).toEqual({ kind: "done" });
  });

  it("thêm hiệp khi đang tập tăng số hiệp của bài hiện tại", () => {
    expect(run([{ type: "addSet" }]).items[0].sets).toBe(3);
  });

  it("thêm hiệp khi đang nghỉ sau bài vừa xong → nghỉ xong quay lại bài đó", () => {
    const s = run([
      { type: "logSet", now: T },
      { type: "skipRest" },
      { type: "logSet", now: T },
      { type: "addSet" },
    ]);
    expect(s.items[0].sets).toBe(3);
    expect(s.phase).toEqual({ kind: "rest", item: 0, endsAt: T + 90_000 });
    expect(currentPosition(run([{ type: "skipRest" }], s))).toEqual({ item: 0, set: 2 });
  });

  it("đánh giá bài và kết thúc sớm", () => {
    const s = run([{ type: "rate", item: 0, rating: "hard" }, { type: "finish" }]);
    expect(s.items[0].rating).toBe("hard");
    expect(s.phase).toEqual({ kind: "done" });
  });

  it("sự kiện không hợp lệ với pha hiện tại thì giữ nguyên trạng thái", () => {
    const s = initialPlayer(plan);
    expect(run([{ type: "skipRest" }], s)).toBe(s);
    expect(run([{ type: "rate", item: 99, rating: "easy" }], s)).toBe(s);
    const resting = run([{ type: "logSet", now: T }]);
    expect(run([{ type: "logSet", now: T }], resting)).toBe(resting);
    expect(run([{ type: "addSet" }], resting)).toBe(resting); // chưa xong bài nào
  });
});

describe("prefillValue", () => {
  const reps = plan[0];
  it("chưa tập lần nào → mức thấp của mục tiêu", () => {
    expect(prefillValue(reps, 0, undefined)).toBe(8);
  });
  it("lấy hiệp tương ứng lần trước, giới hạn trong khoảng mục tiêu", () => {
    expect(prefillValue(reps, 1, [12, 10])).toBe(10);
    expect(prefillValue(reps, 0, [20])).toBe(12);
    expect(prefillValue(reps, 0, [3])).toBe(8);
  });
  it("lần trước ít hiệp hơn → dùng hiệp cuối", () => {
    expect(prefillValue(reps, 2, [11, 9])).toBe(9);
  });
  it("bài giữ theo thời gian dùng khoảng giây", () => {
    expect(prefillValue(plan[1], 0, undefined)).toBe(20);
  });
});

describe("summarize", () => {
  it("gom kết quả theo bài, đánh dấu kỷ lục so với trước đây", () => {
    const state = run([{ type: "rate", item: 0, rating: "medium" }, { type: "skipExercise" }]);
    const result = summarize(
      plan,
      state,
      [
        { exerciseId: "push-up", setIndex: 1, reps: 9 },
        { exerciseId: "push-up", setIndex: 0, reps: 11 },
        { exerciseId: "plank", setIndex: 0, seconds: 30 },
      ],
      new Map([
        ["push-up", 10],
        ["plank", 45],
      ]),
      T,
      T + 1_500_000,
    );
    expect(result.durationMs).toBe(1_500_000);
    expect(result.totalSets).toBe(3);
    expect(result.exercises[0]).toMatchObject({
      values: [11, 9],
      isRecord: true,
      rating: "medium",
    });
    expect(result.exercises[1]).toMatchObject({ values: [30], isRecord: false });
    expect(result.exercises[2]).toMatchObject({ values: [], isRecord: false });
  });

  it("chưa có kết quả cũ thì không tính là kỷ lục", () => {
    const result = summarize(
      plan,
      initialPlayer(plan),
      [{ exerciseId: "squat", setIndex: 0, reps: 15 }],
      new Map(),
      T,
      T,
    );
    expect(result.exercises[2].isRecord).toBe(false);
  });
});
