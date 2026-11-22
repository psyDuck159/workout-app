import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { validateContent, type RawContent } from "./validate";
import push from "./exercises/push.json";
import pull from "./exercises/pull.json";
import legs from "./exercises/legs.json";
import core from "./exercises/core.json";
import accessory from "./exercises/accessory.json";
import ladders from "./ladders.json";
import foundation from "./programs/foundation-12w.json";
import attribution from "./media-attribution.json";

const mediaDir = path.resolve(__dirname, "../../public/media/exercises");
const realMedia = (frame: string) => existsSync(path.join(mediaDir, frame));

const realContent = (): RawContent =>
  structuredClone({
    exercises: [...push, ...pull, ...legs, ...core, ...accessory],
    ladders,
    programs: [foundation],
    attribution,
  });

describe("validateContent — nội dung thật", () => {
  it("không có lỗi", () => {
    const { errors } = validateContent(realContent(), realMedia);
    expect(errors).toEqual([]);
  });
});

// Nội dung tối giản để kiểm tra từng quy tắc.
interface RawExercise {
  id: string;
  measure: string;
  difficulty: number;
  steps: string[];
  equipment?: string[];
  media: { frames: string[] } | null;
  [key: string]: unknown;
}

const exercise = (id: string, extra: Partial<RawExercise> = {}): RawExercise => ({
  id,
  nameVi: id,
  nameEn: id,
  primaryMuscles: ["chest"],
  measure: "reps",
  difficulty: 1,
  steps: ["a", "b"],
  commonMistakes: ["c"],
  media: null,
  sources: [{ title: "s", url: "https://example.com" }],
  ...extra,
});

const minimal = (): RawContent & { exercises: ReturnType<typeof exercise>[] } => ({
  exercises: [exercise("easy"), exercise("hard", { difficulty: 2 })],
  ladders: [
    {
      id: "l",
      nameVi: "L",
      descriptionVi: "L",
      steps: [
        { exerciseId: "easy", advanceWhen: { sets: 3, reps: 10, maxRpe: 7, sessions: 2 } },
        { exerciseId: "hard" },
      ],
    },
  ],
  programs: [
    {
      id: "p",
      nameVi: "P",
      descriptionVi: "P",
      phases: [
        {
          id: "ph",
          order: 1,
          titleVi: "Ph",
          goalVi: "G",
          weeks: 4,
          deloadLastWeek: true,
          sessions: [
            {
              id: "A",
              titleVi: "A",
              items: [{ ladderId: "l", sets: 3, repsMin: 8, repsMax: 12, restSec: 90 }],
            },
          ],
        },
      ],
    },
  ],
  attribution: {},
});

const noMedia = () => false;

describe("validateContent — quy tắc", () => {
  it("nội dung tối giản hợp lệ", () => {
    expect(validateContent(minimal(), noMedia).errors).toEqual([]);
  });

  it("báo lỗi schema", () => {
    const c = minimal();
    c.exercises[0].steps = ["chỉ một bước"];
    expect(validateContent(c, noMedia).errors[0]).toMatch(/exercises: 0\.steps/);
  });

  it("báo trùng id", () => {
    const c = minimal();
    c.exercises.push(exercise("easy"));
    expect(validateContent(c, noMedia).errors).toContain("Trùng exercise id: easy");
  });

  it("báo thiếu file ảnh và thiếu ghi công", () => {
    const c = minimal();
    c.exercises[0].media = { frames: ["easy/0.webp"] };
    const { errors } = validateContent(c, noMedia);
    expect(errors).toContain("easy: thiếu file ảnh easy/0.webp");
    expect(errors.some((e) => e.includes("chưa có ghi công"))).toBe(true);
  });

  it("CC-BY-SA bắt buộc có tác giả", () => {
    const c = minimal();
    c.exercises[0].media = { frames: ["easy/0.webp"] };
    c.attribution = {
      "easy/0.webp": {
        source: "wger.de",
        sourceUrl: "https://wger.de",
        license: "CC-BY-SA-4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        author: null,
        modified: "x",
      },
    };
    expect(validateContent(c, () => true).errors).toContain(
      "easy/0.webp: giấy phép CC-BY-SA-4.0 bắt buộc ghi tác giả",
    );
  });

  it("ladder tham chiếu bài không tồn tại", () => {
    const c = minimal();
    (c.ladders as { steps: { exerciseId: string }[] }[])[0].steps[1].exerciseId = "missing";
    expect(validateContent(c, noMedia).errors).toContain("ladder l bậc 2: không có bài missing");
  });

  it("advanceWhen phải khớp kiểu đo của bài", () => {
    const c = minimal();
    c.exercises[0].measure = "time";
    const { errors } = validateContent(c, noMedia);
    expect(errors).toContain("ladder l bậc 1: bài easy đo thời gian, advanceWhen cần seconds");
    expect(errors).toContain("p/ph/A bài 1: có bài đo thời gian nhưng thiếu secondsMin/secondsMax");
  });

  it("ladder chỉ gồm bài cần xà thì bài trong buổi phải có requires", () => {
    const c = minimal();
    for (const e of c.exercises) e.equipment = ["pullup_bar"];
    const { errors } = validateContent(c, noMedia);
    expect(errors.some((e) => e.includes("cần thêm requires"))).toBe(true);
  });

  it("cảnh báo khi độ khó giảm dần trong thang", () => {
    const c = minimal();
    c.exercises[1].difficulty = 1;
    c.exercises[0].difficulty = 3;
    expect(validateContent(c, noMedia).warnings.some((w) => w.includes("thấp hơn bậc trước"))).toBe(
      true,
    );
  });
});
