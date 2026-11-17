import { useEffect, useRef } from "react";
import { TeamBadge } from "@/components/brand/team-badge";
import { MatchStatusBadge } from "@/components/ui/match-status-badge";
import { getMatchDetail } from "@/domain/calendar/match-detail";
import { formatLocalDateLong } from "@/domain/time";
import type { Competition, Match, Team } from "@/domain/types";

export function CalendarMatchDetail({
  matches,
  teams,
  competitions,
  now,
  timeZone,
  selectedMatchId,
  onClose,
}: {
  matches: readonly Match[];
  teams: readonly Team[];
  competitions: readonly Competition[];
  now: Date;
  timeZone: string;
  selectedMatchId: string;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const teamById = new Map(teams.map((team) => [team.id, team]));

  useEffect(() => {
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (matches.length === 0) return null;

  const firstMatch = matches[0];
  if (!firstMatch) return null;
  const dateLabel = formatLocalDateLong(firstMatch.kickoffAt, timeZone);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-inverse/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-calendario-title"
        className="max-h-[min(90vh,44rem)] w-full overflow-y-auto rounded-t-3xl bg-surface text-ink shadow-2xl sm:max-w-2xl sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink/10 bg-surface/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            <p className="eyebrow text-river-ink">Calendario</p>
            <h2 id="detalle-calendario-title" className="mt-1 font-display text-2xl uppercase sm:text-3xl">
              Partidos del {dateLabel}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/15 text-xl text-ink-muted transition-colors hover:border-ink hover:text-ink"
            aria-label="Cerrar detalle de partidos"
          >
            ×
          </button>
        </div>

        <div className="space-y-3 p-4 sm:p-6">
          {matches.map((match) => {
            const detail = getMatchDetail(match, now, timeZone);
            const home = teamById.get(match.homeTeamId);
            const away = teamById.get(match.awayTeamId);
            const competition = competitions.find((item) => item.id === match.competitionId);
            const isSelected = match.id === selectedMatchId;

            return (
              <article
                key={match.id}
                className={`rounded-2xl border p-4 transition-colors sm:p-5 ${
                  isSelected ? "border-river/60 bg-river-soft/50" : "border-ink/10 bg-paper"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <MatchStatusBadge
                      status={detail.status}
                      minute={detail.status === "live" || detail.status === "halftime" ? Number.parseInt(detail.minuteLabel ?? "", 10) || null : null}
                    />
                    {competition ? (
                      <span className="text-[0.65rem] font-bold uppercase tracking-widest text-ink-muted">
                        {competition.shortName}
                      </span>
                    ) : null}
                  </div>
                  <span className="font-display text-lg font-bold tabular-nums">{detail.time}</span>
                </div>

                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <TeamSummary team={home} fallback="River" />
                  <div className="text-center font-display text-2xl font-bold tabular-nums">
                    {detail.score ?? "vs"}
                  </div>
                  <TeamSummary team={away} fallback="Rival" align="right" />
                </div>

                <dl className="mt-5 grid gap-3 border-t border-ink/10 pt-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[0.62rem] font-bold uppercase tracking-widest text-ink-muted">Sede</dt>
                    <dd className="mt-1 font-semibold">{detail.venue}</dd>
                  </div>
                  {detail.reason ? (
                    <div>
                      <dt className="text-[0.62rem] font-bold uppercase tracking-widest text-ink-muted">Motivo</dt>
                      <dd className="mt-1 font-semibold">{detail.reason}</dd>
                    </div>
                  ) : null}
                </dl>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function TeamSummary({
  team,
  fallback,
  align = "left",
}: {
  team?: Team;
  fallback: string;
  align?: "left" | "right";
}) {
  return (
    <div className={`min-w-0 ${align === "right" ? "text-right" : ""}`}>
      <div className={`flex items-center gap-2 ${align === "right" ? "justify-end" : ""}`}>
        {align === "right" ? null : team ? <TeamBadge team={team} size="sm" /> : null}
        <span className="truncate font-display text-sm font-bold uppercase sm:text-base">
          {team?.name ?? fallback}
        </span>
        {align === "right" ? team ? <TeamBadge team={team} size="sm" /> : null : null}
      </div>
    </div>
  );
}
