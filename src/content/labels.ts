import type { Gear, HouseholdItem, MeasureType, MuscleGroup } from "./schema";
import type { DifficultyFilter } from "@/domain/search";

export const muscleLabels: Record<MuscleGroup, string> = {
  chest: "Ngực",
  back: "Lưng",
  shoulders: "Vai",
  arms: "Tay",
  core: "Bụng",
  legs: "Chân",
  glutes: "Mông",
  full_body: "Toàn thân",
};

export const gearLabels: Record<Gear, string> = {
  pullup_bar: "Xà đơn",
  resistance_band: "Dây kháng lực",
};

export const householdLabels: Record<HouseholdItem, string> = {
  wall: "Tường",
  chair: "Ghế",
  table: "Bàn",
  towel: "Khăn",
  door: "Cửa",
};

export const measureLabels: Record<MeasureType, string> = {
  reps: "Số lần",
  time: "Thời gian giữ",
  reps_each_side: "Số lần mỗi bên",
};

export const difficultyLabels: Record<DifficultyFilter, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};
