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
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-md">
      <h3 className="font-bold text-lg">{exercise.name}</h3>
      <p className="text-sm text-gray-600">{exercise.target}</p>
      <p className="text-sm">{exercise.reps}</p>
      <p className="text-xs mt-2">{exercise.description}</p>
      <div className="flex items-center space-x-2 mt-2">
        <Checkbox id={exercise.name} checked={checked} onCheckedChange={handleChange} />
        <Label htmlFor={exercise.name} className="text-sm">Hoàn thành</Label>
      </div>
      <a 
        href={exercise.illustration} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-500 flex items-center mt-2 text-sm"
      >
        Xem minh họa <ExternalLink className="ml-1 w-4 h-4" />
      </a>
    </div>
  );
}