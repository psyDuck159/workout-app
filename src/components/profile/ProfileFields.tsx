"use client";

import type { Gear } from "@/content/schema";
import { gearLabels, goalLabels } from "@/content/labels";
import type { Goal, SessionMinutes } from "@/data/types";
import { DAYS_PER_WEEK, SESSION_MINUTES } from "@/domain/profile";
import { ChoiceGroup, ToggleCard } from "@/components/ChoiceGroup";

const gearDescriptions: Record<Gear, string> = {
  pullup_bar: "Xà treo khung cửa hoặc xà ngoài công viên",
  resistance_band: "Dây đàn hồi dạng vòng hoặc có tay cầm",
};

export function GoalField({ value, onChange }: { value?: Goal; onChange: (goal: Goal) => void }) {
  return (
    <ChoiceGroup
      legend="Mục tiêu chính của bạn"
      name="goal"
      value={value}
      onChange={onChange}
      options={(Object.keys(goalLabels) as Goal[]).map((g) => ({
        value: g,
        title: goalLabels[g].title,
        description: goalLabels[g].description,
      }))}
    />
  );
}

export function ScheduleFields({
  daysPerWeek,
  sessionMinutes,
  onDaysChange,
  onMinutesChange,
}: {
  daysPerWeek?: number;
  sessionMinutes?: SessionMinutes;
  onDaysChange: (days: number) => void;
  onMinutesChange: (minutes: SessionMinutes) => void;
}) {
  const days = Array.from(
    { length: DAYS_PER_WEEK.max - DAYS_PER_WEEK.min + 1 },
    (_, i) => DAYS_PER_WEEK.min + i,
  );
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 font-medium">Số buổi mỗi tuần</legend>
        <div className="flex flex-wrap gap-2">
          {days.map((d) => (
            <label
              key={d}
              className="bg-card has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-ring/50 flex size-12 cursor-pointer items-center justify-center rounded-full border font-medium has-[:focus-visible]:ring-[3px]"
            >
              <input
                type="radio"
                name="daysPerWeek"
                value={d}
                checked={daysPerWeek === d}
                onChange={() => onDaysChange(d)}
                className="sr-only"
              />
              {d}
            </label>
          ))}
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          Người mới nên bắt đầu với 3 buổi, nghỉ ít nhất một ngày giữa các buổi.
        </p>
      </fieldset>
      <ChoiceGroup
        legend="Thời lượng mỗi buổi"
        name="sessionMinutes"
        columns={3}
        value={sessionMinutes}
        onChange={onMinutesChange}
        options={SESSION_MINUTES.map((m) => ({ value: m, title: `${m} phút` }))}
      />
    </div>
  );
}

export function GearFields({
  value,
  onChange,
}: {
  value: Gear[];
  onChange: (gear: Gear[]) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 font-medium">Dụng cụ bạn có</legend>
      <p className="text-muted-foreground mb-2 text-sm">
        Không có cũng không sao — chương trình đều có bài thay thế bằng tường, ghế, bàn, khăn.
      </p>
      {(Object.keys(gearLabels) as Gear[]).map((g) => (
        <ToggleCard
          key={g}
          title={gearLabels[g]}
          description={gearDescriptions[g]}
          checked={value.includes(g)}
          onChange={(on) => onChange(on ? [...value, g] : value.filter((x) => x !== g))}
        />
      ))}
    </fieldset>
  );
}

const weekdays = [
  { value: 1, label: "T2" },
  { value: 2, label: "T3" },
  { value: 3, label: "T4" },
  { value: 4, label: "T5" },
  { value: 5, label: "T6" },
  { value: 6, label: "T7" },
  { value: 0, label: "CN" },
];

/** Ngày tập ưa thích (FR-SCH-01) — chỉ để nhắc, lịch vẫn là hàng đợi nên lỡ ngày không sao. */
export function PreferredDaysField({
  value,
  onChange,
}: {
  value: number[];
  onChange: (days: number[]) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 font-medium">Ngày tập trong tuần</legend>
      <div className="grid grid-cols-7 gap-1">
        {weekdays.map((d) => (
          <label
            key={d.value}
            className="bg-card has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-ring/50 flex h-11 cursor-pointer items-center justify-center rounded-md border text-sm font-medium has-[:focus-visible]:ring-[3px]"
          >
            <input
              type="checkbox"
              checked={value.includes(d.value)}
              onChange={(e) =>
                onChange(
                  e.target.checked ? [...value, d.value] : value.filter((x) => x !== d.value),
                )
              }
              className="sr-only"
            />
            {d.label}
          </label>
        ))}
      </div>
      <p className="text-muted-foreground mt-2 text-sm">
        Không bắt buộc. Lỡ ngày thì buổi đó vẫn chờ bạn ở lần tập tới.
      </p>
    </fieldset>
  );
}
