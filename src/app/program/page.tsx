import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { defaultProgram } from "@/content";

export const metadata: Metadata = { title: "Chương trình tập" };

export default function ProgramPage() {
  const program = defaultProgram;

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">{program.nameVi}</h1>
        <p className="text-muted-foreground">{program.descriptionVi}</p>
      </header>

      <ol className="space-y-3">
        {program.phases.map((phase) => (
          <li key={phase.id}>
            <Link
              href={`/program/phase/${phase.id}`}
              className="bg-card hover:bg-accent flex items-center gap-3 rounded-lg border p-4 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <p className="font-semibold">{phase.titleVi}</p>
                <p className="text-muted-foreground text-sm">{phase.goalVi}</p>
                <p className="text-muted-foreground text-xs">
                  {phase.weeks} tuần · {phase.sessions.length} buổi luân phiên
                  {phase.deloadLastWeek && " · tuần cuối giảm tải"}
                </p>
              </div>
              <ChevronRight className="text-muted-foreground size-5 shrink-0" aria-hidden />
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
