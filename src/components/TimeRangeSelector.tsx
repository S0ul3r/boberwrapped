"use client";

import type { TimeRange } from "@/types/spotify";
import { TIME_RANGE_LABELS } from "@/lib/constants";

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "short_term", label: TIME_RANGE_LABELS.short_term },
  { value: "medium_term", label: TIME_RANGE_LABELS.medium_term },
  { value: "long_term", label: TIME_RANGE_LABELS.long_term },
];

interface TimeRangeSelectorProps {
  readonly value: TimeRange;
  readonly onChange: (v: TimeRange) => void;
}

export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-2 rounded-full bg-zinc-900 p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          type="button"
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            value === opt.value
              ? "bg-[#1db954] text-black"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
