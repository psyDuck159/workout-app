import WorkoutPhase from "@/components/WorkoutPhase";
import { phases } from "../../workout-data";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

// Chỉ sinh trước các giai đoạn có sẵn để tương thích static export (Capacitor).
export const dynamicParams = false;

export function generateStaticParams() {
  return phases.map((phase) => ({ id: String(phase.id) }));
}

export default async function PhasePage({ params }: Props) {
  const { id } = await params;
  const phase = phases.find((p) => p.id === parseInt(id, 10));

  if (!phase) notFound();

  return <WorkoutPhase phase={phase} />;
}
