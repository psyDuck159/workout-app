import { describe, expect, it } from "vitest";
import { buildSkeleton, renderPose, solveTwoBone, type Vec } from "./skeleton";
import { poses } from "./poses";
import push from "../../src/content/exercises/push.json";
import pull from "../../src/content/exercises/pull.json";
import legs from "../../src/content/exercises/legs.json";
import core from "../../src/content/exercises/core.json";
import accessory from "../../src/content/exercises/accessory.json";

const dist = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe("solveTwoBone", () => {
  it("chạm đúng đích trong tầm với và giữ độ dài xương", () => {
    const [joint, end] = solveTwoBone([0, 0], [20, 10], 20, 19, 1);
    expect(dist(end, [20, 10])).toBeCloseTo(0);
    expect(dist([0, 0], joint)).toBeCloseTo(20);
    expect(dist(joint, end)).toBeCloseTo(19);
  });

  it("bend đổi phía khớp giữa", () => {
    const [down] = solveTwoBone([0, 0], [30, 0], 20, 19, 1);
    const [up] = solveTwoBone([0, 0], [30, 0], 20, 19, -1);
    expect(down[1]).toBeGreaterThan(0); // y hướng xuống trong SVG
    expect(up[1]).toBeLessThan(0);
  });

  it("đích ngoài tầm với thì duỗi thẳng về phía đích", () => {
    const [joint, end] = solveTwoBone([0, 0], [100, 0], 20, 19, 1);
    expect(joint).toEqual([20, 0]);
    expect(end[0]).toBeCloseTo(39);
    expect(end[1]).toBeCloseTo(0);
  });
});

describe("poses", () => {
  const exerciseIds = [...push, ...pull, ...legs, ...core, ...accessory].map((e) => e.id).sort();

  it("mọi bài tập đều có tư thế và không có tư thế thừa", () => {
    expect(Object.keys(poses).sort()).toEqual(exerciseIds);
  });

  it("mọi khớp nằm trong khung hình", () => {
    for (const [id, frames] of Object.entries(poses)) {
      frames.forEach((pose, i) => {
        const sk = buildSkeleton(pose);
        const points: Vec[] = [
          sk.head,
          ...[sk.near, sk.far].flatMap((l) => [l.elbow, l.wrist, l.knee, l.ankle, l.toe]),
        ];
        for (const [x, y] of points) {
          expect({ id, frame: i, x, y }).toEqual({
            id,
            frame: i,
            x: expect.toSatisfy((v: number) => v >= 0 && v <= 200),
            y: expect.toSatisfy((v: number) => v >= 0 && v <= 150),
          });
        }
      });
    }
  });

  it("SVG có tiêu đề để hỗ trợ trình đọc màn hình", () => {
    expect(renderPose(poses["push-up"][0], "Chống đẩy")).toContain("<title>Chống đẩy</title>");
  });
});
