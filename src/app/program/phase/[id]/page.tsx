import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import PhaseSessions from "@/components/PhaseSessions";
import { defaultProgram, getPhase, programClientData } from "@/content";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return defaultProgram.phases.map((phase) => ({ id: phase.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getPhase(defaultProgram.id, (await params).id)?.titleVi };
}

export default async function PhasePage({ params }: Props) {
  const phase = getPhase(defaultProgram.id, (await params).id);
  if (!phase) notFound();

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <Link
        href="/program"
        className="text-muted-foreground inline-flex items-center gap-1 text-sm hover:underline"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {defaultProgram.nameVi}
      </Link>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold">{phase.titleVi}</h1>
        <p className="text-muted-foreground">{phase.goalVi}</p>
        <p className="text-sm">
          {phase.weeks} tuần · 3 buổi/tuần, xen kẽ {phase.sessions.map((s) => s.id).join(" và ")}
          {phase.deloadLastWeek &&
            ". Tuần cuối là tuần giảm tải: giảm khoảng một nửa số hiệp để cơ thể hồi phục."}
        </p>
      </header>

      <PhaseSessions data={programClientData()} phaseId={phase.id} />
    </main>
  );
}
