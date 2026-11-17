"use client";

import { computeCountdown, formatCountdown } from "@/domain/time";
import { useNow } from "@/components/providers/time-zone-provider";

export function MatchCountdown({
  target,
  initialNow,
  compact = false,
}: {
  target: string;
  initialNow: string;
  compact?: boolean;
}) {
  const now = useNow(1000, initialNow);
  const countdown = computeCountdown(target, now);

  if (countdown.isPast) {
    return (
      <span className="font-display text-sm font-semibold uppercase tracking-wide text-river-ink">
        El partido comenzó
      </span>
    );
  }

  const blocks = [
    { value: countdown.days, label: "días" },
    { value: countdown.hours, label: "horas" },
    { value: countdown.minutes, label: "min" },
    { value: countdown.seconds, label: "seg" },
  ];

  return (
    <div className="flex items-center gap-2" role="timer" aria-label={`Faltan ${formatCountdown(countdown)}`}>
      {blocks.map((block, index) => (
        <div key={block.label} className="flex items-center gap-2">
          <div
            className={`flex flex-col items-center rounded-lg tabular-nums ${
              compact ? "min-w-9 bg-white/10 px-1.5 py-1" : "min-w-11 bg-white/10 px-2 py-1.5"
            }`}
          >
            <span className={`font-display font-bold leading-none ${compact ? "text-base" : "text-xl"}`}>
              {String(block.value).padStart(2, "0")}
            </span>
            <span className="mt-0.5 text-[0.55rem] font-bold uppercase tracking-widest opacity-60">
              {block.label}
            </span>
          </div>
          {index < blocks.length - 1 ? <span className="text-white/30" aria-hidden="true">:</span> : null}
        </div>
      ))}
    </div>
  );
}
