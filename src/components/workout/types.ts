import type { Exercise } from "@/content/schema";

/** Thông tin bài tập gửi xuống player (gọn hơn Exercise đầy đủ). */
export type WorkoutExercise = Pick<
  Exercise,
  "id" | "nameVi" | "measure" | "equipment" | "assistance"
> & {
  frames: string[];
  /** Hai lỗi thường gặp đầu tiên, nhắc nhanh trong lúc tập. */
  cues: string[];
};

export type WorkoutLadder = { id: string; steps: { exerciseId: string }[] };
