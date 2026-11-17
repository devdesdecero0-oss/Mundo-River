import type { MatchStatus } from "@/domain/types";

const STATUS_META: Record<
  MatchStatus,
  { label: string; className: string; dot: string; icon: string }
> = {
  scheduled: {
    label: "Próximo",
    className: "border-ink/15 bg-surface text-ink",
    dot: "bg-ink/35",
    icon: "○",
  },
  live: {
    label: "En vivo",
    className: "border-river bg-river text-white",
    dot: "bg-white animate-live",
    icon: "●",
  },
  halftime: {
    label: "Entretiempo",
    className: "border-river bg-river-soft text-river-dark",
    dot: "bg-river animate-live",
    icon: "◐",
  },
  finished: {
    label: "Finalizado",
    className: "border-ink/15 bg-strong text-on-strong",
    dot: "bg-on-strong/60",
    icon: "■",
  },
  postponed: {
    label: "Aplazado",
    className: "border-warning-line/60 bg-warning-soft text-warning-ink",
    dot: "bg-gold",
    icon: "◷",
  },
  suspended: {
    label: "Suspendido",
    className: "border-alert-line bg-alert-soft text-alert-ink",
    dot: "bg-orange-500",
    icon: "Ⅱ",
  },
  cancelled: {
    label: "Cancelado",
    className: "border-ink/20 bg-paper-deep text-ink-muted",
    dot: "bg-ink/40",
    icon: "×",
  },
};

export function MatchStatusBadge({
  status,
  minute,
  size = "md",
  className = "",
}: {
  status: MatchStatus;
  minute?: number | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const meta = STATUS_META[status];
  const live = status === "live" || status === "halftime";
  const label = live && minute ? `En vivo, minuto ${minute}` : meta.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-display font-semibold uppercase tracking-wide ${
        size === "sm" ? "px-2.5 py-1 text-[0.68rem]" : "px-3 py-1.5 text-xs"
      } ${meta.className} ${className}`}
      aria-label={label}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      <span>
        {status === "live" ? "En vivo" : meta.label}
        {live && minute ? ` · ${minute}'` : ""}
      </span>
    </span>
  );
}

export function statusLabel(status: MatchStatus): string {
  return STATUS_META[status].label;
}
