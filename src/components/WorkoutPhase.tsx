"use client"; // Thêm dòng này để biến thành Client Component
import { useState } from "react"; // Nếu chưa có
import ExerciseCard from "./ExerciseCard";
import { Phase } from "@/app/workout-data";

interface WorkoutPhaseProps {
  phase: Phase;
}

export default function WorkoutPhase({ phase }: WorkoutPhaseProps) {
  // Di chuyển handleComplete vào đây (nếu cần tracking toàn cục)
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  const handleComplete = (name: string, completed: boolean) => {
    setCompletedExercises((prev) => {
      const newSet = new Set(prev);
      if (completed) {
        newSet.add(name);
      } else {
        newSet.delete(name);
      }
      return newSet;
    });
    console.log(`${name} completed: ${completed}`); // Hoặc lưu vào localStorage/context
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{phase.title}</h1>
      <p className="mb-6">Tập 3 ngày/tuần, 3 hiệp/bài, nghỉ 60-90s.</p>
      {phase.exercises.map((ex) => (
        <ExerciseCard key={ex.name} exercise={ex} onComplete={handleComplete} /> // Bây giờ truyền được
      ))}
      {/* Optional: Hiển thị progress */}
      <div className="mt-4">Hoàn thành: {completedExercises.size}/{phase.exercises.length}</div>
    </div>
  );
}