"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GearIndex } from "@/data/repositories";
import { useProfile, useRepositories, useSettings } from "@/data/hooks";
import type { Settings, UserProfile } from "@/data/types";
import { getPersistState, requestPersistentStorage, type PersistState } from "@/platform/storage";
import { Button, buttonVariants } from "@/components/ui/button";
import { ToggleCard } from "@/components/ChoiceGroup";
import DataSection from "./DataSection";
import { GearFields, GoalField, PreferredDaysField, ScheduleFields } from "./ProfileFields";

const persistLabels: Record<PersistState, string> = {
  granted: "Đã bật — trình duyệt sẽ không tự xóa dữ liệu.",
  denied: "Chưa được cấp — trình duyệt có thể xóa dữ liệu khi máy thiếu dung lượng.",
  unsupported: "Trình duyệt không hỗ trợ — nên sao lưu dữ liệu định kỳ.",
};

export default function SettingsForm({
  gearIndex,
  exerciseNames,
}: {
  gearIndex: GearIndex;
  exerciseNames: Record<string, string>;
}) {
  const repos = useRepositories();
  const { data: profile, loading } = useProfile();
  const { data: settings } = useSettings();
  const [status, setStatus] = useState("");
  const [persist, setPersist] = useState<PersistState>();

  useEffect(() => {
    getPersistState().then(setPersist);
  }, []);

  if (loading) return null;

  async function saveProfile(patch: ProfilePatch) {
    try {
      await repos.updateProfile(patch, gearIndex);
      setStatus("Đã lưu.");
    } catch {
      setStatus("Không lưu được thay đổi.");
    }
  }

  async function saveSettings(patch: Partial<Omit<Settings, "id">>) {
    try {
      await repos.saveSettings(patch);
      setStatus("Đã lưu.");
    } catch {
      setStatus("Không lưu được thay đổi.");
    }
  }

  // DataSection luôn ở cùng vị trí trong cây để không bị tạo lại (mất thông báo) khi nhập
  // file sao lưu làm hồ sơ xuất hiện.
  return (
    <div className="space-y-8">
      {profile ? (
        <>
          <p className="text-muted-foreground min-h-5 text-sm" role="status" aria-live="polite">
            {status}
          </p>

          <ProfileSection initial={profile} onSave={saveProfile} />
          {settings && <PreferencesSection initial={settings} onSave={saveSettings} />}

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Lưu trữ</h2>
            <p className="text-muted-foreground text-sm">
              Dữ liệu chỉ lưu trên thiết bị này, không gửi lên máy chủ.
            </p>
            {persist && (
              <p className="text-sm">
                <span className="font-medium">Lưu trữ bền vững: </span>
                {persistLabels[persist]}
              </p>
            )}
            {persist === "denied" && (
              <Button
                variant="outline"
                onClick={async () => setPersist(await requestPersistentStorage())}
              >
                Yêu cầu lại
              </Button>
            )}
          </section>
        </>
      ) : (
        <div className="space-y-4">
          <p>Bạn chưa thiết lập hồ sơ trên thiết bị này.</p>
          <Link href="/welcome" className={buttonVariants()}>
            Thiết lập ngay
          </Link>
          <p className="text-muted-foreground text-sm">
            Đã có file sao lưu từ máy khác? Nhập ở mục Dữ liệu bên dưới để khôi phục.
          </p>
        </div>
      )}

      <DataSection key="data" exerciseNames={exerciseNames} />
    </div>
  );
}

type ProfilePatch = Partial<Omit<UserProfile, "id" | "createdAt">>;

// Hai phần dưới giữ bản nháp cục bộ để ô chọn đổi ngay khi chạm, việc lưu chạy ngầm phía sau.

function ProfileSection({
  initial,
  onSave,
}: {
  initial: UserProfile;
  onSave: (patch: ProfilePatch) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const update = (patch: ProfilePatch) => {
    setDraft((d) => ({ ...d, ...patch }));
    onSave(patch);
  };

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">Hồ sơ tập luyện</h2>
      <GearFields value={draft.gear} onChange={(gear) => update({ gear })} />
      <ScheduleFields
        daysPerWeek={draft.daysPerWeek}
        sessionMinutes={draft.sessionMinutes}
        onDaysChange={(daysPerWeek) => update({ daysPerWeek })}
        onMinutesChange={(sessionMinutes) => update({ sessionMinutes })}
      />
      <PreferredDaysField
        value={draft.preferredDays ?? []}
        onChange={(preferredDays) => update({ preferredDays })}
      />
      <GoalField value={draft.goal} onChange={(goal) => update({ goal })} />
    </section>
  );
}

function PreferencesSection({
  initial,
  onSave,
}: {
  initial: Settings;
  onSave: (patch: Partial<Omit<Settings, "id">>) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const update = (patch: Partial<Omit<Settings, "id">>) => {
    setDraft((d) => ({ ...d, ...patch }));
    onSave(patch);
  };

  return (
    <section className="space-y-2">
      <h2 className="mb-2 text-lg font-semibold">Khi tập</h2>
      <ToggleCard
        title="Âm báo"
        description="Phát tiếng khi hết giờ nghỉ hoặc hết thời gian giữ"
        checked={draft.sound}
        onChange={(sound) => update({ sound })}
      />
      <ToggleCard
        title="Rung"
        description="Rung khi hết giờ nghỉ (nếu thiết bị hỗ trợ)"
        checked={draft.vibration}
        onChange={(vibration) => update({ vibration })}
      />
      <ToggleCard
        title="Giữ màn hình sáng"
        description="Không tắt màn hình trong lúc tập"
        checked={draft.keepAwake}
        onChange={(keepAwake) => update({ keepAwake })}
      />
    </section>
  );
}
