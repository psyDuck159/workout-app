import { describe, expect, it } from "vitest";
import type { Gear } from "@/content/schema";
import {
  evaluateProgression,
  type ExerciseSessionResult,
  type ProgressionDecision,
  type ProgressionLadder,
} from "./progression";

const rule = { sets: 3, reps: 12, maxRpe: 7, sessions: 2 };
const ladder: ProgressionLadder = {
  id: "push",
  steps: [
    { exerciseId: "wall", advanceWhen: { ...rule, reps: 15 } },
    { exerciseId: "incline", advanceWhen: rule },
    { exerciseId: "band-push", advanceWhen: rule },
    { exerciseId: "push-up" },
  ],
};
const exercises = new Map(
  (
    [
      ["wall", []],
      ["incline", []],
      ["band-push", ["resistance_band"]],
      ["push-up", []],
    ] as [string, Gear[]][]
  ).map(([id, equipment]) => [id, { id, equipment }]),
);

const target = { measure: "reps" as const, sets: 3, repsMin: 8, repsMax: 12 };
const result = (
  values: number[],
  extra: Partial<ExerciseSessionResult> = {},
): ExerciseSessionResult => ({
  target,
  values,
  pain: false,
  ...extra,
});
const MAX = [12, 12, 12];

interface Scenario {
  name: string;
  exerciseId: string;
  history: ExerciseSessionResult[];
  gear?: Gear[];
  expected: ProgressionDecision["kind"];
  to?: string;
  reason?: RegExp;
}

const scenarios: Scenario[] = [
  { name: "chưa có lịch sử", exerciseId: "incline", history: [], expected: "hold" },
  {
    name: "mới đạt tối đa 1 buổi",
    exerciseId: "incline",
    history: [result(MAX)],
    expected: "hold",
  },
  {
    name: "đạt tối đa 2 buổi liên tiếp → lên bậc, bỏ qua bậc cần dây khi không có dây",
    exerciseId: "incline",
    history: [result(MAX), result(MAX)],
    expected: "advance",
    to: "push-up",
    reason: /3×12 trong 2 buổi liên tiếp/,
  },
  {
    name: "có dây kháng lực → lên bậc kế tiếp cần dây",
    exerciseId: "incline",
    history: [result(MAX), result(MAX)],
    gear: ["resistance_band"],
    expected: "advance",
    to: "band-push",
  },
  {
    name: "đạt tối đa nhưng đánh giá Vừa (RPE 7) vẫn lên bậc",
    exerciseId: "incline",
    history: [result(MAX, { rpe: 7 }), result(MAX, { rpe: 6 })],
    expected: "advance",
  },
  {
    name: "đạt tối đa nhưng đánh giá Khó → giữ nguyên",
    exerciseId: "incline",
    history: [result(MAX, { rpe: 9 }), result(MAX)],
    expected: "hold",
  },
  {
    name: "buổi gần nhất thiếu một hiệp đạt tối đa → giữ nguyên",
    exerciseId: "incline",
    history: [result([12, 12, 11]), result(MAX)],
    expected: "hold",
  },
  {
    name: "đạt tối đa ở buổi cũ nhưng không liên tiếp → giữ nguyên",
    exerciseId: "incline",
    history: [result(MAX), result([10, 9, 9]), result(MAX)],
    expected: "hold",
  },
  {
    name: "tiêu chí thang (15) cao hơn mục tiêu giai đoạn (12) → dùng mục tiêu giai đoạn",
    exerciseId: "wall",
    history: [result(MAX), result(MAX)],
    expected: "advance",
    to: "incline",
    reason: /3×12/,
  },
  {
    name: "tập thêm hiệp vượt tối đa cũng tính",
    exerciseId: "incline",
    history: [result([13, 12, 12, 10]), result([12, 14, 12])],
    expected: "advance",
  },
  {
    name: "Khó 2 buổi liên tiếp → hạ bậc",
    exerciseId: "incline",
    history: [result([9, 8, 8], { rpe: 9 }), result([9, 9, 8], { rpe: 9 })],
    expected: "regress",
    to: "wall",
    reason: /"Khó" 2 buổi liên tiếp/,
  },
  {
    name: "2 buổi liên tiếp nhiều hiệp dưới mức tối thiểu → hạ bậc",
    exerciseId: "incline",
    history: [result([8, 6, 5]), result([7, 6, 6])],
    expected: "regress",
    reason: /chưa đạt mức tối thiểu 8/,
  },
  {
    name: "chỉ 1 buổi khó → giữ nguyên",
    exerciseId: "incline",
    history: [result([6, 5, 5], { rpe: 9 }), result([10, 10, 9])],
    expected: "hold",
  },
  {
    name: "đang ở bậc thấp nhất mà khó → giữ nguyên (không có bậc dễ hơn)",
    exerciseId: "wall",
    history: [result([5, 5, 4], { rpe: 9 }), result([5, 4, 4], { rpe: 9 })],
    expected: "hold",
  },
  {
    name: "buổi gần nhất có báo đau → không tạo đề xuất trùng",
    exerciseId: "incline",
    history: [result(MAX, { pain: true }), result(MAX)],
    expected: "hold",
  },
  {
    name: "bậc cao nhất đạt tối đa 2 buổi → gợi ý tăng khối lượng",
    exerciseId: "push-up",
    history: [result(MAX), result(MAX)],
    expected: "increase",
  },
  {
    name: "bậc cao nhất nhưng khó → giữ nguyên",
    exerciseId: "push-up",
    history: [result(MAX, { rpe: 9 }), result(MAX)],
    expected: "hold",
  },
  {
    name: "bài giữ theo thời gian dùng giây",
    exerciseId: "incline",
    history: [
      result([40, 40, 41], {
        target: { measure: "time", sets: 3, secondsMin: 20, secondsMax: 40 },
      }),
      result([40, 45, 40], {
        target: { measure: "time", sets: 3, secondsMin: 20, secondsMax: 40 },
      }),
    ],
    expected: "advance",
    reason: /3×40 giây/,
  },
];

describe("evaluateProgression", () => {
  it(`có ít nhất 15 kịch bản (${scenarios.length})`, () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(15);
  });

  it.each(scenarios)("$name", ({ exerciseId, history, gear = [], expected, to, reason }) => {
    const decision = evaluateProgression(exerciseId, history, ladder, exercises, gear);
    expect(decision.kind).toBe(expected);
    if (to) expect(decision).toMatchObject({ toExerciseId: to });
    if (reason) expect("reasonVi" in decision && decision.reasonVi).toMatch(reason);
  });
});

describe("mô phỏng 4 tuần (3 buổi/tuần)", () => {
  /**
   * Chạy lần lượt 12 buổi; người dùng chấp nhận mọi đề xuất lên/hạ bậc.
   * Như repository, lịch sử chỉ tính các buổi từ lần đổi bậc gần nhất.
   */
  function simulate(perSession: (exerciseId: string, nthAtStep: number) => ExerciseSessionResult) {
    let current = "wall";
    let history: ExerciseSessionResult[] = [];
    const timeline: string[] = [];
    for (let session = 1; session <= 12; session++) {
      history = [perSession(current, history.length + 1), ...history];
      const decision = evaluateProgression(current, history, ladder, exercises, []);
      timeline.push(`${session}:${decision.kind}:${current}`);
      if (decision.kind === "advance" || decision.kind === "regress") {
        current = decision.toExerciseId;
        history = [];
      }
    }
    return timeline;
  }

  it("người tiến bộ đều: lên bậc sau 2 buổi đạt tối đa, tới bậc cao nhất thì gợi ý tăng khối lượng", () => {
    // Ở mỗi bậc: 2 buổi đầu chưa đạt, từ buổi thứ 3 đạt tối đa.
    const timeline = simulate((_, n) => result(n <= 2 ? [10, 9 + n, 9] : MAX, { rpe: 7 }));
    expect(timeline.filter((t) => !t.includes(":hold:"))).toEqual([
      "4:advance:wall",
      "8:advance:incline",
      "12:increase:push-up",
    ]);
  });

  it("người quá sức ở bậc mới: hạ bậc, rồi phải đạt lại 2 buổi mới được đề xuất lên", () => {
    const timeline = simulate((exerciseId) =>
      exerciseId === "wall" ? result(MAX, { rpe: 6 }) : result([7, 6, 5], { rpe: 9 }),
    );
    expect(timeline.slice(0, 6)).toEqual([
      "1:hold:wall",
      "2:advance:wall",
      "3:hold:incline",
      "4:regress:incline",
      "5:hold:wall",
      "6:advance:wall",
    ]);
  });
});
