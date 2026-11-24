"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import type { Gear } from "@/content/schema";
import { disclaimerVi, healthQuestions } from "@/content/health";
import type { GearIndex } from "@/data/repositories";
import { useProfile, useRepositories } from "@/data/hooks";
import type { Goal, SessionMinutes } from "@/data/types";
import { buildProfile, DAYS_PER_WEEK } from "@/domain/profile";
import { requestPersistentStorage } from "@/platform/storage";
import { Button, buttonVariants } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ChoiceGroup";
import { GearFields, GoalField, ScheduleFields } from "./ProfileFields";

const STEPS = ["goal", "schedule", "gear", "health"] as const;

interface OnboardingProps {
  programId: string;
  gearIndex: GearIndex;
}

export default function Onboarding({ programId, gearIndex }: OnboardingProps) {
  const router = useRouter();
  const repos = useRepositories();
  const { data: existing, loading } = useProfile();

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal>();
  const [daysPerWeek, setDaysPerWeek] = useState<number>(DAYS_PER_WEEK.default);
  const [sessionMinutes, setSessionMinutes] = useState<SessionMinutes>(30);
  const [gear, setGear] = useState<Gear[]>([]);
  const [healthYes, setHealthYes] = useState<boolean>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  if (loading) return null;
  if (existing) {
    return (
      <div className="space-y-4">
        <p>Bạn đã thiết lập hồ sơ trên thiết bị này.</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/" className={buttonVariants()}>
            Về trang chủ
          </Link>
          <Link href="/settings" className={buttonVariants({ variant: "outline" })}>
            Sửa trong Cài đặt
          </Link>
        </div>
      </div>
    );
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  async function finish(skipHealth: boolean) {
    setSaving(true);
    setError(undefined);
    try {
      const profile = buildProfile(
        { goal, daysPerWeek, sessionMinutes, gear, healthYes: skipHealth ? undefined : healthYes },
        programId,
      );
      await repos.completeOnboarding(profile, gearIndex);
      await requestPersistentStorage();
      router.push("/");
    } catch {
      setError("Không lưu được hồ sơ. Trình duyệt có thể đang chặn lưu dữ liệu.");
      setSaving(false);
    }
  }

  // "Bỏ qua" chỉ bỏ câu trả lời của bước hiện tại, các bước sau vẫn hiện.
  function skip() {
    if (current === "goal") setGoal(undefined);
    if (current === "schedule") {
      setDaysPerWeek(DAYS_PER_WEEK.default);
      setSessionMinutes(30);
    }
    if (current === "gear") setGear([]);
    if (isLast) void finish(true);
    else setStep(step + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground text-sm" aria-live="polite">
          Bước {step + 1}/{STEPS.length}
        </p>
        <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full" aria-hidden>
          <div
            className="bg-primary h-full transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {current === "goal" && <GoalField value={goal} onChange={setGoal} />}
      {current === "schedule" && (
        <ScheduleFields
          daysPerWeek={daysPerWeek}
          sessionMinutes={sessionMinutes}
          onDaysChange={setDaysPerWeek}
          onMinutesChange={setSessionMinutes}
        />
      )}
      {current === "gear" && <GearFields value={gear} onChange={setGear} />}
      {current === "health" && (
        <div className="space-y-4">
          <div>
            <p className="mb-2 font-medium">Có ý nào dưới đây đúng với bạn không?</p>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
              {healthQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
          <ChoiceGroup
            legend="Câu trả lời của bạn"
            name="health"
            value={healthYes === undefined ? undefined : healthYes ? "yes" : "no"}
            onChange={(v) => setHealthYes(v === "yes")}
            options={[
              { value: "no", title: "Không có ý nào" },
              { value: "yes", title: "Có ít nhất một ý" },
            ]}
          />
          {healthYes && (
            <div className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
              <p>
                Bạn nên hỏi ý kiến bác sĩ trước khi bắt đầu. Nếu vẫn tập, hãy giữ ở các bài dễ nhất
                và dừng ngay khi thấy khó chịu.
              </p>
            </div>
          )}
          <p className="text-muted-foreground text-sm">{disclaimerVi}</p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {step > 0 && (
          <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={saving}>
            Quay lại
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={skip} disabled={saving}>
            Bỏ qua
          </Button>
          {isLast ? (
            <Button onClick={() => finish(healthYes === undefined)} disabled={saving}>
              {saving ? "Đang lưu…" : "Bắt đầu tập"}
            </Button>
          ) : (
            <Button onClick={() => setStep(step + 1)}>Tiếp tục</Button>
          )}
        </div>
      </div>
      {isLast && (
        <p className="text-muted-foreground text-xs">
          Bấm &quot;Bắt đầu tập&quot; nghĩa là bạn đã đọc lưu ý trên. Dữ liệu chỉ lưu trên thiết bị
          này.
        </p>
      )}
    </div>
  );
}
