import type { AdvanceWhen, Exercise, Program } from "./schema";

/** Phần nội dung dùng ở client (không kéo Zod và toàn bộ nội dung xuống trình duyệt). */
export interface ProgramClientData {
  program: Program;
  ladders: {
    id: string;
    nameVi: string;
    steps: { exerciseId: string; advanceWhen?: AdvanceWhen }[];
  }[];
  exercises: Pick<Exercise, "id" | "nameVi" | "equipment" | "measure">[];
}
