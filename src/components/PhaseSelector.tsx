"use client";
import { useRouter } from "next/navigation";
import { phases } from "@/app/workout-data";

export default function PhaseSelector() {
  const router = useRouter();

  return (
    <div className="flex justify-center mb-8">
      <select 
        onChange={(e) => router.push(`/phase/${e.target.value}`)}
        className="p-2 border rounded"
        defaultValue=""
      >
        <option value="">Chọn giai đoạn</option>
        {phases.map((phase) => (
          <option key={phase.id} value={phase.id}>
            Giai đoạn {phase.id} ({phase.weeks})
          </option>
        ))}
      </select>
    </div>
  );
}