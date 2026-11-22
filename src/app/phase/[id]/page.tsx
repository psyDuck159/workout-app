import WorkoutPhase from "@/components/WorkoutPhase";
import { phases } from "../../workout-data";
import { notFound } from "next/navigation";

interface Props {
  params: { id: string };
}

export default function PhasePage({ params }: Props) {
  const phaseId = parseInt(params.id);
  const phase = phases.find((p) => p.id === phaseId);

  if (!phase) notFound();

  return <WorkoutPhase phase={phase} />;
}