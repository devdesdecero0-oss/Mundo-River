"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { TeamBadge } from "@/components/brand/team-badge";
import { CalendarMatchDetail } from "@/components/calendar/calendar-match-detail";
import { useNow, useTimeZone } from "@/components/providers/time-zone-provider";
import { LocalDayHeader } from "@/components/ui/local-date";
import { MatchStatusBadge } from "@/components/ui/match-status-badge";
import {
  addMonthsToMonthKey,
  buildMonthGrid,
  formatLocalTime,
  formatMonthLabel,
  getMonthKey,
  toLocalDateKey,
} from "@/domain/time";
import {
  countMatchesByStatus,
  getMatchesForDateKey,
  groupMatchesByLocalDate,
} from "@/domain/matches";
import { computeMatchMinute, deriveMatchStatus, isLiveStatus } from "@/domain/matches/status";
import type { Competition, DateKey, Match, MatchStatus, Team } from "@/domain/types";

type View = "mes" | "agenda";
type StatusFilter = "all" | "live" | "scheduled" | "finished" | "other";

const STATUS_OPTIONS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "Todos los estados" },
  { id: "live", label: "En vivo" },
  { id: "scheduled", label: "Próximos" },
  { id: "finished", label: "Finalizados" },
  { id: "other", label: "Aplazados / suspendidos" },
];

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function accent(status: MatchStatus): string {
  switch (status) {
    case "live":
    case "halftime":
      return "border-l-river bg-river-soft/80 hover:bg-river-soft";
    case "finished":
      return "border-l-ink-muted/60 bg-ink-muted/[0.08] hover:bg-ink-muted/[0.14]";
    case "postponed":
      return "border-l-warning-line bg-warning-soft hover:bg-warning-soft/80";
    case "suspended":
      return "border-l-alert-line bg-alert-soft hover:bg-alert-soft/80";
    case "cancelled":
      return "border-l-ink/20 bg-paper-deep hover:bg-line/60";
    default:
      return "border-l-river/30 bg-surface hover:bg-paper";
  }
}

export function CalendarView({
  matches,
  competitions,
  teams,
  seasonLabel,
  nowIso,
}: {
  matches: Match[];
  competitions: Competition[];
  teams: Team[];
  seasonLabel: string;
  nowIso: string;
}) {
  const { timeZone } = useTimeZone();
  const now = useNow(30_000, nowIso);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(() => searchParams.get("partido"));

  const [view, setView] = useState<View>(() => (searchParams.get("vista") === "agenda" ? "agenda" : "mes"));
  const [competition, setCompetition] = useState<string>(() => {
    const value = searchParams.get("comp");
    return value && competitions.some((item) => item.id === value) ? value : "all";
  });
  const [status, setStatus] = useState<StatusFilter>(() => {
    const value = searchParams.get("estado");
    return STATUS_OPTIONS.some((option) => option.id === value) ? (value as StatusFilter) : "all";
  });
  const [month, setMonth] = useState(() => {
    const value = searchParams.get("mes");
    if (value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return value;
    return getMonthKey(nowIso, timeZone);
  });

  const teamById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const currentMonth = getMonthKey(now, timeZone);
  const previousTimeZone = useRef(timeZone);

  useEffect(() => {
    if (previousTimeZone.current === timeZone) return;
    previousTimeZone.current = timeZone;
    if (!searchParams.get("mes")) setMonth(getMonthKey(new Date(), timeZone));
  }, [timeZone, searchParams]);

  useEffect(() => {
    setSelectedMatchId(searchParams.get("partido"));
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (competition !== "all") params.set("comp", competition);
    if (status !== "all") params.set("estado", status);
    if (view === "agenda") params.set("vista", "agenda");
    if (month !== currentMonth) params.set("mes", month);
    if (selectedMatchId && matches.some((match) => match.id === selectedMatchId)) {
      params.set("partido", selectedMatchId);
    }
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    if (nextUrl !== currentUrl) {
      window.history.replaceState(window.history.state, "", nextUrl);
    }
  }, [competition, status, view, month, currentMonth, pathname, searchParams, selectedMatchId, matches]);

  const filterByStatus = (match: Match): boolean => {
    if (status === "all") return true;
    const derived = deriveMatchStatus(match, now);
    if (status === "live") return isLiveStatus(derived);
    if (status === "finished") return derived === "finished";
    if (status === "scheduled") return derived === "scheduled";
    return !isLiveStatus(derived) && derived !== "finished" && derived !== "scheduled";
  };

  const inCompetition = useMemo(
    () => (competition === "all" ? matches : matches.filter((match) => match.competitionId === competition)),
    [matches, competition],
  );

  const monthMatches = useMemo(
    () =>
      inCompetition
        .filter((match) => getMonthKey(match.kickoffAt, timeZone) === month)
        .filter(filterByStatus),
    // filterByStatus depende de status/now; se recalcula con esas claves
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inCompetition, timeZone, month, status, now],
  );

  const agendaMatches = useMemo(
    () => inCompetition.filter(filterByStatus),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inCompetition, status, now],
  );

  const filtered = view === "mes" ? monthMatches : agendaMatches;
  const groups = useMemo(() => groupMatchesByLocalDate(agendaMatches, timeZone), [agendaMatches, timeZone]);
  const grid = useMemo(() => buildMonthGrid(month as `${number}-${number}`), [month]);
  const counts = useMemo(() => countMatchesByStatus(inCompetition, now), [inCompetition, now]);
  const liveCount = counts.live + counts.halftime;

  const availableCompetitions = competitions.filter((item) =>
    matches.some((match) => match.competitionId === item.id),
  );
  const selectedMatch = selectedMatchId
    ? inCompetition.find((match) => match.id === selectedMatchId) ?? null
    : null;
  const selectedDateMatches = selectedMatch
    ? inCompetition.filter(
        (match) =>
          toLocalDateKey(match.kickoffAt, timeZone) ===
          toLocalDateKey(selectedMatch.kickoffAt, timeZone),
      )
    : [];

  function openMatchDetail(match: Match) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("partido", match.id);
    setSelectedMatchId(match.id);
    window.history.replaceState(window.history.state, "", `${pathname}?${params.toString()}`);
  }

  function closeMatchDetail() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("partido");
    setSelectedMatchId(null);
    const query = params.toString();
    window.history.replaceState(window.history.state, "", query ? `${pathname}?${query}` : pathname);
  }

  function resetFilters() {
    setCompetition("all");
    setStatus("all");
    setMonth(currentMonth);
    setView("mes");
  }

  function goToToday() {
    setMonth(currentMonth);
  }

  return (
    <div>
      <div className="card -mt-8 relative z-10 p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="scrollbar-thin -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filtrar por competición">
              <button
                type="button"
                className={`chip shrink-0 ${competition === "all" ? "chip-active" : ""}`}
                aria-pressed={competition === "all"}
                onClick={() => setCompetition("all")}
              >
                Todas
              </button>
              {availableCompetitions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`chip shrink-0 ${competition === item.id ? "chip-active" : ""}`}
                  aria-pressed={competition === item.id}
                  onClick={() => setCompetition(item.id)}
                >
                  {item.shortName}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="status-filter">Estado del partido</label>
              <select
                id="status-filter"
                value={status}
                onChange={(event) => setStatus(event.target.value as StatusFilter)}
                className="min-h-11 rounded-full border border-ink/15 bg-paper px-4 text-sm font-semibold outline-none focus:border-river"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>

              <div className="flex rounded-full border border-ink/15 bg-paper p-0.5" role="group" aria-label="Vista del calendario">
                {(["mes", "agenda"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setView(option)}
                    aria-pressed={view === option}
                    className={`min-h-10 rounded-full px-4 font-display text-sm font-semibold uppercase tracking-wide transition-colors ${
                      view === option ? "bg-strong text-on-strong" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {option === "mes" ? "Mes" : "Agenda"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-ink/10 pt-3 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted">
            <span className="text-ink">{seasonLabel}</span>
            {liveCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-river-ink">
                <span className="h-1.5 w-1.5 animate-live rounded-full bg-river" aria-hidden="true" />
                {liveCount} en vivo
              </span>
            ) : null}
            <span>{counts.scheduled} próximos</span>
            <span>{counts.finished} finalizados</span>
            {counts.postponed + counts.suspended + counts.cancelled > 0 ? (
              <span>{counts.postponed + counts.suspended + counts.cancelled} reprogramados</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {view === "mes" ? (
            <>
              <button
                type="button"
                onClick={() => setMonth(addMonthsToMonthKey(month as `${number}-${number}`, -1))}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 bg-surface transition-colors hover:border-ink"
                aria-label="Mes anterior"
              >
                ←
              </button>
              <h2 className="min-w-44 text-center font-display text-2xl uppercase sm:text-3xl" aria-live="polite">
                {formatMonthLabel(month as `${number}-${number}`)}
              </h2>
              <button
                type="button"
                onClick={() => setMonth(addMonthsToMonthKey(month as `${number}-${number}`, 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 bg-surface transition-colors hover:border-ink"
                aria-label="Mes siguiente"
              >
                →
              </button>
              <button type="button" onClick={goToToday} className="chip ml-1">Hoy</button>
            </>
          ) : (
            <h2 className="font-display text-2xl uppercase sm:text-3xl">Agenda de la temporada</h2>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[0.65rem] font-bold uppercase tracking-wide text-ink-muted">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border-l-2 border-l-river bg-river-soft" aria-hidden="true" />En vivo</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border-l-2 border-l-river/30 bg-surface" aria-hidden="true" />Próximo</span>
           <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border-l-2 border-l-ink-muted/60 bg-ink-muted/10" aria-hidden="true" />Finalizado</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border-l-2 border-l-warning-line bg-warning-soft" aria-hidden="true" />Aplazado</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card mt-6 p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-river-soft font-display text-2xl text-river-ink" aria-hidden="true">◷</span>
          <h3 className="mt-4 font-display text-2xl uppercase">No hay partidos con estos filtros</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
            Probá con otra competición, otro mes o limpiá los filtros para ver toda la temporada.
          </p>
          <button type="button" onClick={resetFilters} className="btn btn-primary mt-5">Limpiar filtros</button>
        </div>
      ) : view === "mes" ? (
        <div className="card mt-4 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-ink/10 bg-paper">
            {WEEKDAYS.map((day) => (
              <div key={day} className="px-1 py-2 text-center font-display text-[0.65rem] font-semibold uppercase tracking-widest text-ink-muted sm:text-xs">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grid.map((cell) => {
              const dayMatches = getMatchesForDateKey(monthMatches, cell.dateKey, timeZone);
              const isToday = cell.dateKey === toLocalDateKey(now, timeZone);
              return (
                <div
                  key={cell.dateKey}
                  className={`min-h-16 border-b border-r border-ink/10 p-1 last:border-r-0 sm:min-h-24 sm:p-1.5 ${
                    cell.inMonth ? "bg-surface" : "bg-paper/60"
                  } ${isToday ? "bg-river-soft/60" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    {dayMatches.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => openMatchDetail(dayMatches[0]!)}
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.68rem] font-bold outline-none focus-visible:ring-2 focus-visible:ring-river sm:h-6 sm:w-6 sm:text-xs ${
                          isToday ? "bg-river text-white" : cell.inMonth ? "text-ink" : "text-ink-muted/80"
                        }`}
                        aria-label={`Ver partidos del ${cell.dateKey}`}
                      >
                        {Number(cell.dateKey.slice(-2))}
                      </button>
                    ) : (
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.68rem] font-bold sm:h-6 sm:w-6 sm:text-xs ${
                          isToday ? "bg-river text-white" : cell.inMonth ? "text-ink" : "text-ink-muted/80"
                        }`}
                      >
                        {Number(cell.dateKey.slice(-2))}
                      </span>
                    )}
                    {dayMatches.length > 0 ? (
                      <span className="text-[0.55rem] font-bold text-ink-muted md:hidden">{dayMatches.length}</span>
                    ) : null}
                  </div>

                  <div className="mt-1 hidden flex-col gap-1 md:flex">
                    {dayMatches.slice(0, 2).map((match) => {
                      const matchStatus = deriveMatchStatus(match, now);
                      return (
                        <button
                          key={match.id}
                          type="button"
                          onClick={() => openMatchDetail(match)}
                          className={`block rounded border-l-2 px-1 py-0.5 text-[0.62rem] font-semibold leading-tight transition-colors ${accent(matchStatus)}`}
                          aria-label={`${teamById.get(match.homeTeamId)?.name ?? "River"} vs ${teamById.get(match.awayTeamId)?.name ?? "Rival"}`}
                        >
                          <span className="block truncate tabular-nums opacity-70">
                            {formatLocalTime(match.kickoffAt, timeZone)}
                            {match.statusOverride === "postponed" ? " · APL" : ""}
                          </span>
                          <span className="flex items-center justify-between gap-1">
                            <span className="truncate">
                              {teamById.get(match.homeTeamId)?.shortName}–{teamById.get(match.awayTeamId)?.shortName}
                            </span>
                            <span className="shrink-0 tabular-nums">
                              {match.score ? `${match.score.home}-${match.score.away}` : "vs"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                    {dayMatches.length > 2 ? (
                      <button
                        type="button"
                          onClick={() => openMatchDetail(dayMatches[2]!)}
                        className="text-[0.6rem] font-bold uppercase text-river-ink hover:underline"
                      >
                        +{dayMatches.length - 2} más
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-1 flex flex-wrap gap-0.5 md:hidden">
                    {dayMatches.slice(0, 4).map((match) => {
                      const matchStatus = deriveMatchStatus(match, now);
                       const dot = isLiveStatus(matchStatus) ? "bg-river" : matchStatus === "finished" ? "bg-ink-muted/70" : matchStatus === "postponed" ? "bg-gold" : "bg-river/30";
                      return (
                        <span key={match.id} className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
                      );
                    })}
                  </div>
                  {dayMatches.length > 0 ? (
                    <span className="sr-only">
                      {dayMatches.length} {dayMatches.length === 1 ? "partido" : "partidos"}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-6">
          {groups.map((group) => (
            <section key={group.dateKey} aria-labelledby={`day-${group.dateKey}`}>
              <div className="sticky top-16 z-10 -mx-1 flex items-baseline gap-3 bg-paper/95 px-1 py-2 backdrop-blur md:top-20">
                <LocalDayHeader
                  dateKey={group.dateKey as DateKey}
                  nowIso={now.toISOString()}
                  className="font-display text-xl uppercase tracking-wide"
                />
                <span id={`day-${group.dateKey}`} className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  {group.matches.length} {group.matches.length === 1 ? "partido" : "partidos"}
                </span>
              </div>
              <div className="card divide-y divide-ink/10 overflow-hidden">
                {group.matches.map((match) => {
                  const matchStatus = deriveMatchStatus(match, now);
                  const minute = computeMatchMinute(match, now);
                  const home = teamById.get(match.homeTeamId);
                  const away = teamById.get(match.awayTeamId);
                  const competition = competitions.find((item) => item.id === match.competitionId);
                  return (
                    <button
                      key={match.id}
                      type="button"
                      onClick={() => openMatchDetail(match)}
                      className="group grid w-full grid-cols-[3.3rem_1fr_auto] items-center gap-3 p-3 text-left transition-colors hover:bg-paper sm:grid-cols-[4.5rem_1fr_auto] sm:p-4"
                    >
                      <div className="text-center">
                        <span className="block font-display text-lg font-bold tabular-nums">
                          {formatLocalTime(match.kickoffAt, timeZone)}
                        </span>
                        <span className="mt-0.5 block text-[0.6rem] font-bold uppercase tracking-wide text-ink-muted">
                          {competition?.shortName}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {home ? <TeamBadge team={home} size="sm" /> : null}
                          <span className="truncate font-display text-sm uppercase sm:text-base">{home?.name}</span>
                          <span className="ml-auto shrink-0 font-display text-lg font-bold tabular-nums sm:ml-4">
                            {match.score ? match.score.home : "–"}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          {away ? <TeamBadge team={away} size="sm" /> : null}
                          <span className="truncate font-display text-sm uppercase sm:text-base">{away?.name}</span>
                          <span className="ml-auto shrink-0 font-display text-lg font-bold tabular-nums sm:ml-4">
                            {match.score ? match.score.away : "–"}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-[0.65rem] text-ink-muted">
                          {match.round} · {match.venue}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <MatchStatusBadge status={matchStatus} minute={minute} size="sm" />
                        <span className="text-river-ink transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {selectedMatch && selectedDateMatches.length > 0 ? (
        <CalendarMatchDetail
          matches={selectedDateMatches}
          teams={teams}
          competitions={competitions}
          now={now}
          timeZone={timeZone}
          selectedMatchId={selectedMatch.id}
          onClose={closeMatchDetail}
        />
      ) : null}
    </div>
  );
}
