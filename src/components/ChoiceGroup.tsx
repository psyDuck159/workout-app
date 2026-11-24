"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const cardClass =
  "bg-card flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors " +
  "has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-[3px]";

export interface ChoiceOption<T extends string | number> {
  value: T;
  title: string;
  description?: string;
}

/** Nhóm radio dạng thẻ, chạm được cả thẻ. */
export function ChoiceGroup<T extends string | number>({
  legend,
  name,
  options,
  value,
  onChange,
  columns = 1,
}: {
  legend: string;
  name: string;
  options: ChoiceOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  columns?: 1 | 3;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 font-medium">{legend}</legend>
      <div className={cn("grid gap-2", columns === 3 && "grid-cols-3")}>
        {options.map((option) => (
          <label key={option.value} className={cn(cardClass, columns === 3 && "justify-center")}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className={cn("flex-1", columns === 3 && "flex-none text-center")}>
              <span className="block font-medium">{option.title}</span>
              {option.description && (
                <span className="text-muted-foreground block text-sm">{option.description}</span>
              )}
            </span>
            {columns === 1 && value === option.value && (
              <Check className="text-primary size-5" aria-hidden />
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Ô chọn bật/tắt dạng thẻ. */
export function ToggleCard({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description?: string;
}) {
  return (
    <label className={cardClass}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-primary size-5 shrink-0"
      />
      <span className="flex-1">
        <span className="block font-medium">{title}</span>
        {description && <span className="text-muted-foreground block text-sm">{description}</span>}
      </span>
    </label>
  );
}
