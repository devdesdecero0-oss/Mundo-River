import { deriveMatchStatus, computeMatchMinute } from "@/domain/matches/status";
import { formatLocalTime } from "@/domain/time";
import type { Match, MatchStatus } from "@/domain/types";

const STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: "Próximo",
  live: "En vivo",
  halftime: "Entretiempo",
  finished: "Finalizado",
  postponed: "Aplazado",
  suspended: "Suspendido",
  cancelled: "Cancelado",
};

export interface MatchDetail {
  status: MatchStatus;
  statusLabel: string;
  time: string;
  venue: string;
  score: string | null;
  reason: string | null;
  minuteLabel: string | null;
}

export function getMatchDetail(
  match: Match,
  now: Date | string,
  timeZone: string,
): MatchDetail {
  const status = deriveMatchStatus(match, now);
  const minute = computeMatchMinute(match, now);

  return {
    status,
    statusLabel: STATUS_LABELS[status],
    time: formatLocalTime(match.kickoffAt, timeZone),
    venue: match.venue.trim() || "Sede no informada",
    score: match.score ? `${match.score.home} - ${match.score.away}` : null,
    reason: match.statusReason?.trim() || null,
    minuteLabel:
      status === "halftime"
        ? "Entretiempo"
        : minute === null
          ? null
          : `${minute}'`,
  };
}
