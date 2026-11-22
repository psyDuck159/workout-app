"use client";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ExternalLink } from "lucide-react";
import { Exercise } from "@/app/workout-data";

interface ExerciseCardProps {
  exercise: Exercise;
  onComplete?: (name: string, completed: boolean) => void;
}

export default function ExerciseCard({ exercise, onComplete }: ExerciseCardProps) {
  const [checked, setChecked] = useState(false);

  const handleChange = (completed: boolean) => {
    setChecked(completed);
    onComplete?.(exercise.name, completed); // Gọi prop nếu có
  };

  return (
    <div className="mb-4 rounded-lg border bg-white p-4 shadow-md">
      <h3 className="text-lg font-bold">{exercise.name}</h3>
      <p className="text-sm text-gray-600">{exercise.target}</p>
      <p className="text-sm">{exercise.reps}</p>
      <p className="mt-2 text-xs">{exercise.description}</p>
      <div className="mt-2 flex items-center space-x-2">
        <Checkbox id={exercise.name} checked={checked} onCheckedChange={handleChange} />
        <Label htmlFor={exercise.name} className="text-sm">
          Hoàn thành
        </Label>
      </div>
      <a
        href={exercise.illustration}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center text-sm text-blue-500"
      >
        Xem minh họa <ExternalLink className="ml-1 h-4 w-4" />
      </a>
    </div>
  );
}
