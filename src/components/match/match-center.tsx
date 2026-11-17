"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { TeamBadge } from "@/components/brand/team-badge";
import { useNow, useTimeZone } from "@/components/providers/time-zone-provider";
import { LocalDate } from "@/components/ui/local-date";
import { MatchStatusBadge } from "@/components/ui/match-status-badge";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import {
  buildStatComparison,
  averageTeamRating,
  formatRating,
  ratingTone,
  selectMvp,
} from "@/domain/stats";
import {
  formatLocalDateTime,
  formatUpdatedAgo,
} from "@/domain/time";
import { computeMatchMinute, deriveMatchStatus } from "@/domain/matches/status";
import { selectLineupForTeam } from "@/domain/matches";
import { unknownPlayer } from "@/domain/squad";
import type {
  Competition,
  H2HSummary,
  Match,
  MatchEvent,
  Player,
  PlayerMatchStats,
  Team,
} from "@/domain/types";
import { MatchCountdown } from "./match-countdown";

type TabId = "resumen" | "incidencias" | "estadisticas" | "formaciones" | "calificaciones";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "resumen", label: "Resumen" },
  { id: "incidencias", label: "Incidencias" },
  { id: "estadisticas", label: "Estadísticas" },
  { id: "formaciones", label: "Formaciones" },
  { id: "calificaciones", label: "Calificaciones" },
];

const POSITION_ORDER: Record<Player["position"], number> = { GK: 0, DF: 1, MF: 2, FW: 3 };

export function MatchCenter({
  match,
  homeTeam,
  awayTeam,
  competition,
  playerStats,
  players,
  h2h,
  previousMeetings,
  nowIso,
}: {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  competition: Competition | null;
  playerStats: PlayerMatchStats[];
  players: Player[];
  h2h: H2HSummary;
  previousMeetings: Match[];
  nowIso: string;
}) {
  const { timeZone } = useTimeZone();
  const now = useNow(30_000, nowIso);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<TabId>(() => {
    const value = searchParams.get("tab");
    return TABS.some((candidate) => candidate.id === value) ? (value as TabId) : "resumen";
  });
  const [lastRefresh, setLastRefresh] = useState(() => new Date(nowIso));
  const [shared, setShared] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const status = deriveMatchStatus(match, now);
  const minute = computeMatchMinute(match, now);
  const isLive = status === "live" || status === "halftime";
  const unavailable = ["postponed", "suspended", "cancelled"].includes(status);
  const visibleTabs = unavailable
    ? TABS.filter((candidate) => candidate.id === "resumen" || candidate.id === "formaciones")
    : TABS;
  const activeTab = visibleTabs.some((candidate) => candidate.id === tab) ? tab : "resumen";

  const playerById = useMemo(() => new Map(players.map((player) => [player.id, player])), [players]);
  const riverTeam = homeTeam.id === "river" ? homeTeam : awayTeam;
  const opponentTeam = riverTeam.id === homeTeam.id ? awayTeam : homeTeam;
  const lineup = useMemo(
    () => selectLineupForTeam(match.lineups, riverTeam.id),
    [match.lineups, riverTeam.id],
  );
  const opponentLineup = useMemo(
    () => selectLineupForTeam(match.lineups, opponentTeam.id),
    [match.lineups, opponentTeam.id],
  );
  const unavailablePlayers = useMemo(
    () =>
      players.filter(
        (player) => player.availability === "injured" || player.availability === "suspended",
      ),
    [players],
  );
  const mvp = useMemo(() => selectMvp(playerStats), [playerStats]);
  const average = useMemo(() => averageTeamRating(playerStats), [playerStats]);

  useEffect(() => {
    if (!isLive) return;
    const timer = window.setInterval(() => {
      if (!navigator.onLine) return;
      setLastRefresh(new Date());
      router.refresh();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [isLive, router]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeTab === "resumen") params.delete("tab");
    else params.set("tab", activeTab);
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    if (nextUrl !== currentUrl) router.replace(nextUrl, { scroll: false });
  }, [activeTab, pathname, router, searchParams]);

  const secondsAgo = Math.max(0, Math.floor((now.getTime() - lastRefresh.getTime()) / 1000));

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const lastIndex = visibleTabs.length - 1;
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = index === lastIndex ? 0 : index + 1;
    if (event.key === "ArrowLeft") nextIndex = index === 0 ? lastIndex : index - 1;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = lastIndex;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextTab = visibleTabs[nextIndex];
    if (!nextTab) return;
    setTab(nextTab.id);
    tabRefs.current[nextIndex]?.focus();
  }

  async function shareMatch() {
    const url = typeof window === "undefined" ? "" : window.location.href;
    const title = `${homeTeam.name} vs ${awayTeam.name} · Mundo River`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShared(true);
        window.setTimeout(() => setShared(false), 2500);
      }
    } catch {
      setShared(false);
    }
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-inverse pb-10 pt-6 text-white md:pb-14 md:pt-8">
        <div className="pointer-events-none absolute inset-0 band-motif" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-24 top-0 h-full w-1/3 -skew-x-12 bg-river/15" aria-hidden="true" />

        <div className="container-page relative">
          <nav aria-label="Migas de pan" className="text-[0.68rem] font-semibold uppercase tracking-wide text-white/60">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="hover:text-white">Inicio</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/calendario" className="hover:text-white">Calendario</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-white/80" aria-current="page">{homeTeam.shortName} vs {awayTeam.shortName}</li>
            </ol>
          </nav>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-white/55">
                <span className="inline-block h-px w-7 bg-river" aria-hidden="true" />
                {competition?.name ?? "Temporada"} · {match.round}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <MatchStatusBadge status={status} minute={minute} />
              {isLive ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.onLine) return;
                    setLastRefresh(new Date());
                    router.refresh();
                  }}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/20 px-3 text-[0.68rem] font-bold uppercase tracking-wide text-white/75 hover:bg-white/10"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Actualizar
                </button>
              ) : null}
              <button
                type="button"
                onClick={shareMatch}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/20 px-3 text-[0.68rem] font-bold uppercase tracking-wide text-white/75 hover:bg-white/10"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 16V4m0 0L7 9m5-5 5 5M5 15v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {shared ? "Copiado" : "Compartir"}
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6">
            <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-start sm:text-left">
              <TeamBadge team={homeTeam} size="lg" />
              <div>
                <p className="font-display text-lg uppercase leading-none sm:text-2xl">{homeTeam.name}</p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-widest text-white/60">Local</p>
              </div>
            </div>

            <div className="text-center">
              {match.score && status !== "scheduled" ? (
                <p className="font-display text-5xl font-bold leading-none tabular-nums sm:text-6xl">
                  {match.score.home}
                  <span className="mx-2 text-white/30">:</span>
                  {match.score.away}
                </p>
              ) : (
                <p className="font-display text-3xl font-semibold uppercase text-white/60 sm:text-4xl">vs</p>
              )}
              {isLive && minute ? (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-river px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest">
                  <span className="h-1.5 w-1.5 animate-live rounded-full bg-white" aria-hidden="true" />
                  Minuto {minute}
                </p>
              ) : null}
              {match.score?.halftime && status === "finished" ? (
                <p className="mt-2 text-[0.65rem] font-semibold uppercase tracking-wide text-white/60">
                  PT {match.score.halftime.home}-{match.score.halftime.away}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col items-center gap-2 text-center sm:flex-row-reverse sm:justify-start sm:text-right">
              <TeamBadge team={awayTeam} size="lg" />
              <div>
                <p className="font-display text-lg uppercase leading-none sm:text-2xl">{awayTeam.name}</p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-widest text-white/60">Visitante</p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-5 sm:flex-row">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-center text-[0.72rem] text-white/55 sm:text-left">
              <span className="inline-flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 3v4M8 3v4M3 11h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <LocalDate value={match.kickoffAt} variant="datetimeLong" />
              </span>
              <span>{match.venue}</span>
              {match.referee ? <span>Árbitro: {match.referee}</span> : null}
            </div>

            {status === "scheduled" ? (
              <div className="flex items-center gap-3">
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white/60">Comienza en</span>
                <MatchCountdown target={match.kickoffAt} initialNow={nowIso} compact />
              </div>
            ) : isLive ? (
              <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-white/60" role="status">
                {formatUpdatedAgo(secondsAgo)}
              </p>
            ) : (
              <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-white/60">
                Resultado final · {match.statusReason ?? "Datos del partido"}
              </p>
            )}
          </div>
        </div>
      </section>

      {isLive ? (
        <p className="sr-only" role="status" aria-live="polite">
          {homeTeam.name} {match.score?.home ?? 0} - {match.score?.away ?? 0} {awayTeam.name}, minuto {minute ?? 0}. Actualización automática cada 30 segundos.
        </p>
      ) : null}

      <div className="container-page">
        <div className="scrollbar-thin -mx-4 mt-5 flex gap-1 overflow-x-auto border-b border-ink/10 px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Secciones del partido">
          {visibleTabs.map((candidate, index) => {
            const active = activeTab === candidate.id;
            return (
              <button
                key={candidate.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`tab-${candidate.id}`}
                aria-selected={active}
                aria-controls={`panel-${candidate.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => setTab(candidate.id)}
                onKeyDown={(event) => handleTabKey(event, index)}
                className={`relative min-h-12 shrink-0 px-4 font-display text-[0.95rem] font-semibold uppercase tracking-wide transition-colors ${
                  active ? "text-river-ink" : "text-ink-muted hover:text-ink"
                }`}
              >
                {candidate.label}
                {active ? <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-river" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          tabIndex={0}
          className="py-6 outline-none md:py-8"
        >
          {unavailable ? (
            <div className="card border-warning-line/60 bg-warning-soft p-6">
              <p className="eyebrow text-warning-ink">Partido {status === "postponed" ? "aplazado" : status === "suspended" ? "suspendido" : "cancelado"}</p>
              <h2 className="mt-2 font-display text-2xl uppercase">No hay estadísticas para mostrar</h2>
              <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                {match.statusReason ?? "El partido no se disputó en la fecha prevista. Las estadísticas y calificaciones se publicarán cuando se reprograme."}
              </p>
            </div>
          ) : null}

          {!unavailable && activeTab === "resumen" ? (
            <SummaryTab
              match={match}
              status={status}
              minute={minute}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              playerById={playerById}
              lineup={lineup}
              unavailablePlayers={unavailablePlayers}
              h2h={h2h}
              previousMeetings={previousMeetings}
              mvp={mvp}
              nowIso={nowIso}
              timeZone={timeZone}
              playerStats={playerStats}
            />
          ) : null}
          {!unavailable && activeTab === "incidencias" ? (
            <IncidentsTab match={match} status={status} homeTeam={homeTeam} awayTeam={awayTeam} playerById={playerById} />
          ) : null}
          {!unavailable && activeTab === "estadisticas" ? (
            <StatsTab match={match} status={status} homeTeam={homeTeam} awayTeam={awayTeam} />
          ) : null}
          {activeTab === "formaciones" ? (
            <LineupsTab
              lineup={lineup}
              team={riverTeam}
              opponent={opponentTeam}
              opponentLineup={opponentLineup}
              playerById={playerById}
              status={status}
            />
          ) : null}
          {!unavailable && activeTab === "calificaciones" ? (
            <RatingsTab
              playerStats={playerStats}
              playerById={playerById}
              mvp={mvp}
              average={average}
              team={riverTeam}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Resumen ------------------------------ */

function SummaryTab({
  match,
  status,
  minute,
  homeTeam,
  awayTeam,
  playerById,
  lineup,
  unavailablePlayers,
  h2h,
  previousMeetings,
  mvp,
  nowIso,
  timeZone,
  playerStats,
}: {
  match: Match;
  status: ReturnType<typeof deriveMatchStatus>;
  minute: number | null;
  homeTeam: Team;
  awayTeam: Team;
  playerById: Map<string, Player>;
  lineup: Match["lineups"] extends Array<infer L> | undefined ? L | null : never;
  unavailablePlayers: Player[];
  h2h: H2HSummary;
  previousMeetings: Match[];
  mvp: PlayerMatchStats | null;
  nowIso: string;
  timeZone: string;
  playerStats: PlayerMatchStats[];
}) {
  const goalEvents = match.events.filter((event) => ["goal", "own_goal", "penalty_goal"].includes(event.type));
  const scheduled = status === "scheduled";
  const mvpPlayer = mvp ? playerById.get(mvp.playerId) : null;
  const keyStats = match.stats ? buildStatComparison(match.stats).slice(0, 3) : [];

  return (
    <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-5">
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl uppercase">
              {scheduled ? "Previa del partido" : status === "live" || status === "halftime" ? "Así va el partido" : "Resumen final"}
            </h2>
            <MatchStatusBadge status={status} minute={minute} size="sm" />
          </div>

          {scheduled ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm leading-relaxed text-ink-muted">
                {homeTeam.name} recibe a {awayTeam.name} en {match.venue}. El partido corresponde a{" "}
                {match.round.toLowerCase()} y se jugará el{" "}
                <LocalDate value={match.kickoffAt} variant="datetime" />.
              </p>
              <div className="rounded-xl bg-paper p-4">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-muted">Cuenta regresiva</p>
                <div className="mt-2 text-ink">
                  <MatchCountdownLight target={match.kickoffAt} initialNow={nowIso} />
                </div>
              </div>
              <div>
                <p className="eyebrow text-river-ink">Probable formación de River</p>
                {lineup && lineup.starters.length > 0 ? (
                  <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {lineup.starters.map((starter) => {
                      const player = playerById.get(starter.playerId);
                      const name = player?.displayName ?? starter.name ?? "Jugador desconocido";
                      return (
                        <li key={starter.playerId} className="flex items-center gap-2 rounded-lg bg-paper px-2.5 py-1.5 text-sm">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-strong font-display text-[0.65rem] font-bold text-on-strong">
                            {starter.shirtNumber}
                          </span>
                          <span className="truncate font-semibold">{name}</span>
                          <span className="ml-auto text-[0.6rem] font-bold uppercase tracking-wide text-ink-muted">{starter.position}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-2 rounded-lg border border-dashed border-ink/15 p-3 text-xs text-ink-muted">
                    La formación se publica cuando el proveedor la confirma, normalmente cerca del inicio del partido.
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-ink/10 p-3 text-xs text-ink-muted">
                <strong className="text-ink">Ausencias:</strong>{" "}
                {unavailablePlayers.length > 0
                  ? unavailablePlayers
                      .slice(0, 6)
                      .map((player) =>
                        player.injury?.type
                          ? `${player.displayName} (${player.injury.type})`
                          : player.displayName,
                      )
                      .join(" · ")
                  : "sin bajas confirmadas por el proveedor."}
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-paper p-4">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-muted">Goles</p>
                {goalEvents.length > 0 ? (
                  <ul className="mt-2 space-y-1.5">
                    {goalEvents.map((event) => (
                      <li key={event.id} className="flex items-center gap-2 text-sm">
                        <span className="inline-flex min-w-8 justify-center rounded bg-strong px-1.5 py-0.5 text-[0.65rem] font-bold text-on-strong">
                          {event.minute}&apos;
                        </span>
                        <span className="font-bold">{event.type === "own_goal" ? "⚽ Autogol" : event.type === "penalty_goal" ? "⚽ Penal" : "⚽ Gol"}</span>
                        <span className="truncate">
                          {playerById.get(event.playerId)?.displayName ??
                            event.playerName ??
                            event.detail ??
                            "Jugador desconocido"}
                        </span>
                        <span className="ml-auto text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted">
                          {event.teamId === homeTeam.id ? homeTeam.shortName : awayTeam.shortName}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-ink-muted">Sin goles registrados.</p>
                )}
              </div>

              {keyStats.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {keyStats.map((stat) => (
                    <div key={stat.key} className="rounded-xl border border-ink/10 p-3 text-center">
                      <p className="font-display text-xl font-bold tabular-nums">
                        {stat.home}{stat.suffix} <span className="text-ink-muted/40">·</span> {stat.away}{stat.suffix}
                      </p>
                      <p className="mt-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-ink-muted">{stat.label}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {mvpPlayer && mvp ? (
                <div className="flex items-center gap-3 rounded-xl border border-river/20 bg-river-soft/50 p-3.5">
                  <PlayerAvatar player={mvpPlayer} size="md" />
                  <div className="min-w-0">
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-river-ink">MVP del partido</p>
                    <p className="truncate font-display text-lg uppercase leading-tight">{mvpPlayer.displayName}</p>
                  </div>
                  <span className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-river font-display text-lg font-bold text-white">
                    {formatRating(mvp.rating)}
                  </span>
                </div>
              ) : null}

              <p className="text-xs leading-relaxed text-ink-muted">
                {playerStats.length} jugadores calificados ·{" "}
                {match.attendance ? `${match.attendance.toLocaleString("es-AR")} espectadores` : "Asistencia sin datos"} ·{" "}
                {match.broadcasters?.join(" · ") ?? "TV sin confirmar"}
              </p>
            </div>
          )}
        </div>

        {previousMeetings.length > 0 ? (
          <div className="card p-5 sm:p-6">
            <h2 className="font-display text-2xl uppercase">Últimos enfrentamientos</h2>
            <ul className="mt-3 divide-y divide-ink/10">
              {previousMeetings.map((meeting) => (
                <li key={meeting.id}>
                  <Link href={`/partidos/${meeting.id}`} className="flex items-center gap-3 py-2.5 text-sm hover:text-river-ink">
                    <span className="w-16 shrink-0 text-[0.65rem] font-bold uppercase tracking-wide text-ink-muted">
                      <LocalDate value={meeting.kickoffAt} variant="short" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {meeting.homeTeamId === homeTeam.id ? homeTeam.shortName : awayTeam.shortName}{" "}
                      {meeting.score?.home} - {meeting.score?.away}{" "}
                      {meeting.homeTeamId === homeTeam.id ? awayTeam.shortName : homeTeam.shortName}
                    </span>
                    <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted">
                      {meeting.competitionId.includes("libertadores") ? "Libertadores" : meeting.competitionId.includes("copa") ? "Copa" : "Liga"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <aside className="space-y-5">
        <div className="card p-5">
          <p className="eyebrow text-river-ink">Historial directo</p>
          <h2 className="mt-1 font-display text-2xl uppercase">H2H</h2>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-grass/10 p-2.5">
              <p className="font-display text-2xl font-bold text-grass-ink">{h2h.wins}</p>
              <p className="text-[0.6rem] font-bold uppercase tracking-wide text-ink-muted">Victorias</p>
            </div>
            <div className="rounded-lg bg-paper p-2.5">
              <p className="font-display text-2xl font-bold">{h2h.draws}</p>
              <p className="text-[0.6rem] font-bold uppercase tracking-wide text-ink-muted">Empates</p>
            </div>
            <div className="rounded-lg bg-river/10 p-2.5">
              <p className="font-display text-2xl font-bold text-river-ink">{h2h.losses}</p>
              <p className="text-[0.6rem] font-bold uppercase tracking-wide text-ink-muted">Derrotas</p>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-ink-muted">
            {h2h.played} partidos · {h2h.goalsFor} goles a favor / {h2h.goalsAgainst} en contra
          </p>
        </div>

        <div className="card p-5">
          <p className="eyebrow text-river-ink">Datos del partido</p>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Competencia</dt>
              <dd className="text-right font-semibold">{match.round}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Estadio</dt>
              <dd className="text-right font-semibold">{match.venue}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Árbitro</dt>
              <dd className="text-right font-semibold">{match.referee ?? "A confirmar"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">TV</dt>
              <dd className="text-right font-semibold">{match.broadcasters?.join(" · ") ?? "A confirmar"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Tu hora</dt>
              <dd className="text-right font-semibold">{formatLocalDateTime(match.kickoffAt, timeZone)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl bg-inverse p-5 text-white">
          <p className="eyebrow text-white/50">Ficha del partido</p>
          <p className="mt-2 text-xs leading-relaxed text-white/60">
            Datos, incidencias y calificaciones individuales provistos por Bzzoiro Sports Data
            (escala 1,0 a 10,0). SC = sin calificar; las notas vacías no entran al promedio.
          </p>
        </div>
      </aside>
    </div>
  );
}

function MatchCountdownLight({ target, initialNow }: { target: string; initialNow: string }) {
  return (
    <div className="text-ink [&_[role=timer]]:text-ink">
      <MatchCountdown target={target} initialNow={initialNow} />
    </div>
  );
}

/* ----------------------------- Incidencias ----------------------------- */

const EVENT_META: Record<MatchEvent["type"], { icon: string; label: string; className: string }> = {
  goal: { icon: "●", label: "Gol", className: "bg-grass text-white" },
  own_goal: { icon: "●", label: "Autogol", className: "bg-orange-600 text-white" },
  penalty_goal: { icon: "P", label: "Gol de penal", className: "bg-grass text-white" },
  penalty_missed: { icon: "✕", label: "Penal errado", className: "bg-ink/20 text-ink" },
  yellow: { icon: "■", label: "Tarjeta amarilla", className: "bg-gold text-on-light" },
  red: { icon: "■", label: "Tarjeta roja", className: "bg-river text-white" },
  second_yellow: { icon: "■", label: "Segunda amarilla", className: "bg-river text-white" },
  substitution: { icon: "⇄", label: "Cambio", className: "bg-strong text-on-strong" },
  var: { icon: "VAR", label: "Revisión VAR", className: "bg-ink/10 text-ink" },
};

function IncidentsTab({
  match,
  status,
  homeTeam,
  awayTeam,
  playerById,
}: {
  match: Match;
  status: ReturnType<typeof deriveMatchStatus>;
  homeTeam: Team;
  awayTeam: Team;
  playerById: Map<string, Player>;
}) {
  if (status === "scheduled") {
    return (
      <EmptyState
        title="El partido todavía no comenzó"
        body="Las incidencias aparecerán minuto a minuto cuando ruede la pelota."
      />
    );
  }

  if (match.events.length === 0) {
    return <EmptyState title="Sin incidencias registradas" body="No hay goles, tarjetas ni cambios para mostrar en este partido." />;
  }

  const nameOf = (id: string, name?: string, fallback?: string) =>
    playerById.get(id)?.displayName ?? name ?? fallback ?? "Jugador desconocido";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl uppercase">Minuto a minuto</h2>
        <span className="text-[0.65rem] font-bold uppercase tracking-wide text-ink-muted">
          {match.events.length} incidencias
        </span>
      </div>
      <ol className="relative space-y-3 border-l border-ink/10 pl-4">
        {match.events.map((event) => {
          const meta = EVENT_META[event.type];
          const isHome = event.teamId === homeTeam.id;
          const isSub = event.type === "substitution";
          const extra = event.extraMinute ? `+${event.extraMinute}` : "";
          return (
            <li key={event.id} className="relative">
              <span className="absolute -left-[1.28rem] top-3 h-2 w-2 rounded-full border-2 border-paper bg-ink" aria-hidden="true" />
              <div className={`flex flex-wrap items-center gap-2 rounded-xl border p-3 ${isHome ? "border-l-2 border-l-river bg-surface" : "border-l-2 border-l-ink/30 bg-surface"}`}>
                <span className="inline-flex min-w-9 justify-center rounded bg-strong px-1.5 py-1 font-display text-xs font-bold text-on-strong tabular-nums">
                  {event.minute}{extra}&apos;
                </span>
                <span className={`inline-flex min-h-6 items-center justify-center rounded px-1.5 text-[0.62rem] font-bold uppercase ${meta.className}`} aria-label={meta.label}>
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  {isSub ? (
                    <>
                      <p className="text-sm font-semibold text-ink">
                        Entra {nameOf(event.relatedPlayerId ?? "", event.relatedPlayerName)}
                      </p>
                      <p className="text-xs text-ink-muted">Sale {nameOf(event.playerId, event.playerName)}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-ink">
                        {nameOf(event.playerId, event.playerName, event.detail)}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {meta.label}
                        {event.detail && event.type === "var" ? `: ${event.detail}` : ""}
                      </p>
                    </>
                  )}
                </div>
                <span className="ml-auto text-[0.62rem] font-bold uppercase tracking-wide text-ink-muted">
                  {isHome ? homeTeam.shortName : awayTeam.shortName}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card mx-auto max-w-2xl p-8 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paper font-display text-2xl" aria-hidden="true">◷</span>
      <h3 className="mt-4 font-display text-2xl uppercase">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{body}</p>
      <Link href="/calendario" className="btn btn-outline mt-5">Volver al calendario</Link>
    </div>
  );
}

/* ----------------------------- Estadísticas ----------------------------- */

function StatsTab({
  match,
  status,
  homeTeam,
  awayTeam,
}: {
  match: Match;
  status: ReturnType<typeof deriveMatchStatus>;
  homeTeam: Team;
  awayTeam: Team;
}) {
  if (status === "scheduled") {
    return <EmptyState title="Estadísticas disponibles al inicio" body="Cuando empiece el partido vas a ver posesión, tiros, córners y todas las métricas comparadas." />;
  }
  const stats = buildStatComparison(match.stats);
  if (stats.length === 0) {
    return <EmptyState title="Sin estadísticas" body="La fuente no publicó estadísticas comparativas para este partido." />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl uppercase">Estadísticas comparativas</h2>
        <span className="text-[0.65rem] font-bold uppercase tracking-wide text-ink-muted">{homeTeam.shortName} · {awayTeam.shortName}</span>
      </div>
      <div className="card space-y-5 p-5 sm:p-6">
        {stats.map((stat) => (
          <div key={stat.key}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-display text-lg font-bold tabular-nums">{stat.home}{stat.suffix}</span>
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ink-muted">{stat.label}</span>
              <span className="font-display text-lg font-bold tabular-nums">{stat.away}{stat.suffix}</span>
            </div>
            <div
              className="flex h-2.5 overflow-hidden rounded-full bg-paper-deep"
              role="img"
              aria-label={`${stat.label}: ${homeTeam.name} ${stat.home}${stat.suffix}, ${awayTeam.name} ${stat.away}${stat.suffix}`}
            >
              <span className="h-full bg-river" style={{ width: `${stat.homeRatio}%` }} />
              <span className="h-full bg-ink" style={{ width: `${stat.awayRatio}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-[0.65rem] font-bold uppercase tracking-wide text-ink-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-river" aria-hidden="true" />{homeTeam.name}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-ink" aria-hidden="true" />{awayTeam.name}</span>
        {match.attendance ? <span className="ml-auto">Asistencia: {match.attendance.toLocaleString("es-AR")}</span> : null}
      </div>
    </div>
  );
}

/* ------------------------------ Formaciones ------------------------------ */

function lineFor(position: string): number {
  if (position === "GK") return 0;
  if (["RB", "LB", "CB", "DF", "RWB", "LWB"].includes(position)) return 1;
  if (["CM", "MF", "DM", "AM"].includes(position)) return 2;
  return 3;
}

function LineupsTab({
  lineup,
  team,
  opponent,
  opponentLineup,
  playerById,
  status,
}: {
  lineup: Match["lineups"] extends Array<infer L> | undefined ? L | null : never;
  team: Team;
  opponent: Team;
  opponentLineup: Match["lineups"] extends Array<infer L> | undefined ? L | null : never;
  playerById: Map<string, Player>;
  status: ReturnType<typeof deriveMatchStatus>;
}) {
  if (!lineup) {
    return <EmptyState title="Formación no disponible" body="Todavía no se publicó la formación para este partido." />;
  }

  const lines = [0, 1, 2, 3].map((line) =>
    lineup.starters.filter((starter) => lineFor(starter.position) === line),
  );

  const bench =
    lineup.benchPlayers ??
    lineup.bench.map((playerId) => ({
      playerId,
      position: "MF",
      shirtNumber: 0,
      name: undefined as string | undefined,
    }));

  return (
    <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink/10 p-4">
          <div>
            <p className="eyebrow text-river-ink">{status === "scheduled" ? "Formación probable" : "Once inicial"}</p>
            <h2 className="mt-1 font-display text-2xl uppercase">{team.name}</h2>
          </div>
          <span className="rounded-full bg-strong px-3 py-1 font-display text-sm font-bold text-on-strong">{lineup.formation}</span>
        </div>
        <div className="pitch relative p-4 sm:p-6">
          <div className="pointer-events-none absolute inset-4 rounded-lg border border-white/30 sm:inset-6" aria-hidden="true" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 py-2">
            {lines.map((line, index) => (
              <div key={index} className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                {line.map((starter) => {
                  const player = playerById.get(starter.playerId);
                  const name = player?.displayName ?? starter.name ?? "Jugador desconocido";
                  return (
                    <div key={starter.playerId} className="flex w-16 flex-col items-center gap-1 text-center sm:w-20">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 font-display text-xs font-bold shadow-sm ${
                          player?.isCaptain ? "border-gold bg-gold text-on-light" : "border-white/80 bg-white text-on-light"
                        }`}
                        title={player?.isCaptain ? "Capitán" : undefined}
                      >
                        {starter.shirtNumber}
                      </span>
                      <span className="max-w-full truncate text-[0.62rem] font-bold uppercase tracking-wide text-white drop-shadow">
                        {name.split(" ").slice(-1)[0]}
                      </span>
                      {player?.isCaptain ? <span className="text-[0.5rem] font-bold uppercase text-gold">Capitán</span> : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-ink/10 p-4">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-muted">Suplentes</p>
          {bench.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {bench.map((benchPlayer) => {
                const player = playerById.get(benchPlayer.playerId);
                const name = player?.displayName ?? benchPlayer.name ?? "Jugador desconocido";
                return (
                  <li key={benchPlayer.playerId} className="inline-flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-1 text-xs">
                    <span className="font-display font-bold text-ink-muted">
                      {player?.shirtNumber ?? benchPlayer.shirtNumber ?? "–"}
                    </span>
                    {name}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-ink-muted">El proveedor no publicó la lista de suplentes.</p>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card p-5">
          <p className="eyebrow text-river-ink">Cuerpo técnico</p>
          {lineup.coach ? (
            <>
              <p className="mt-2 font-display text-xl uppercase">{lineup.coach}</p>
              <p className="mt-1 text-xs text-ink-muted">Director técnico de {team.name}.</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">
              El proveedor no informó el cuerpo técnico para este partido.
            </p>
          )}
          <div className="mt-4 border-t border-ink/10 pt-3">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-muted">Rival</p>
            <p className="mt-1 text-sm font-semibold">{opponent.name}</p>
            <p className="mt-1 text-xs text-ink-muted">
              {opponentLineup
                ? `Formación confirmada: ${opponentLineup.formation} (${opponentLineup.starters.length} titulares).`
                : "El rival no publicó su formación para este partido."}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-paper p-4 text-xs leading-relaxed text-ink-muted">
          <p className="font-bold uppercase tracking-wide text-ink">Lectura de la formación</p>
          <p className="mt-2">
            {lineup.formation} con {lines[1]?.length ?? 0} defensores, {lines[2]?.length ?? 0} mediocampistas y{" "}
            {lines[3]?.length ?? 0} delanteros. El capitán se marca con el borde dorado.
          </p>
        </div>
      </aside>
    </div>
  );
}

/* ----------------------------- Calificaciones ----------------------------- */

function RatingsTab({
  playerStats,
  playerById,
  mvp,
  average,
  team,
}: {
  playerStats: PlayerMatchStats[];
  playerById: Map<string, Player>;
  mvp: PlayerMatchStats | null;
  average: number | null;
  team: Team;
}) {
  const [sort, setSort] = useState<"rating" | "position">("rating");

  const sorted = useMemo(() => {
    return [...playerStats].sort((a, b) => {
      if (sort === "position") {
        const posA = playerById.get(a.playerId)?.position ?? "MF";
        const posB = playerById.get(b.playerId)?.position ?? "MF";
        const diff = POSITION_ORDER[posA] - POSITION_ORDER[posB];
        if (diff !== 0) return diff;
      }
      const ratingA = a.rating ?? -1;
      const ratingB = b.rating ?? -1;
      if (ratingB !== ratingA) return ratingB - ratingA;
      return b.minutes - a.minutes || a.playerId.localeCompare(b.playerId);
    });
  }, [playerStats, sort, playerById]);

  if (playerStats.length === 0) {
    return <EmptyState title="Sin calificaciones" body="La ficha editorial todavía no publicó las notas individuales de este partido." />;
  }

  const mvpPlayer = mvp ? playerById.get(mvp.playerId) : null;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-river-ink">Rendimiento individual</p>
          <h2 className="mt-1 font-display text-2xl uppercase">Calificaciones de {team.shortName}</h2>
          <p className="mt-1 text-xs text-ink-muted">Escala 1,0 a 10,0 · SC = sin calificar. Las notas vacías se excluyen del promedio.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-ink/15 bg-surface p-0.5" role="group" aria-label="Ordenar calificaciones">
            <button
              type="button"
              onClick={() => setSort("rating")}
              aria-pressed={sort === "rating"}
              className={`min-h-9 rounded-full px-3 text-xs font-bold uppercase tracking-wide ${sort === "rating" ? "bg-strong text-on-strong" : "text-ink-muted"}`}
            >
              Por nota
            </button>
            <button
              type="button"
              onClick={() => setSort("position")}
              aria-pressed={sort === "position"}
              className={`min-h-9 rounded-full px-3 text-xs font-bold uppercase tracking-wide ${sort === "position" ? "bg-strong text-on-strong" : "text-ink-muted"}`}
            >
              Por puesto
            </button>
          </div>
          <div className="rounded-xl border border-ink/10 bg-surface px-3 py-1.5 text-center">
            <p className="text-[0.55rem] font-bold uppercase tracking-widest text-ink-muted">Promedio</p>
            <p className="font-display text-xl font-bold leading-none">{formatRating(average)}</p>
          </div>
        </div>
      </div>

      {mvpPlayer && mvp ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl red-band p-4 text-white sm:p-5">
          <PlayerAvatar player={mvpPlayer} size="lg" />
          <div className="min-w-0">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white/70">MVP del partido</p>
            <p className="truncate font-display text-2xl uppercase leading-tight">{mvpPlayer.displayName}</p>
            <p className="text-xs text-white/70">{mvp.minutes} min · {mvp.goals} goles · {mvp.assists} asistencias</p>
          </div>
          <span className="ml-auto inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white font-display text-xl font-bold text-river">
            {formatRating(mvp.rating)}
          </span>
        </div>
      ) : null}

      <div className="card mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Calificaciones individuales de {team.name} en este partido</caption>
            <thead className="border-b border-ink/10 bg-paper text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-3">Jugador</th>
                <th scope="col" className="px-2 py-3 text-center">Puesto</th>
                <th scope="col" className="px-2 py-3 text-center">Min</th>
                <th scope="col" className="px-2 py-3 text-center">G</th>
                <th scope="col" className="px-2 py-3 text-center">A</th>
                <th scope="col" className="px-2 py-3 text-center">Tarjetas</th>
                <th scope="col" className="px-4 py-3 text-right">Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {sorted.map((row) => {
                const player = playerById.get(row.playerId) ?? unknownPlayer(row.playerId);
                const isMvp = mvp?.playerId === row.playerId;
                const tone = ratingTone(row.rating);
                return (
                  <tr key={row.playerId} className={isMvp ? "bg-river-soft/40" : "hover:bg-paper/60"}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <PlayerAvatar player={player} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {player.displayName}
                            {player.isCaptain ? <span className="ml-1.5 text-[0.55rem] font-bold text-gold">C</span> : null}
                          </p>
                          {isMvp ? <span className="text-[0.55rem] font-bold uppercase tracking-widest text-river-ink">MVP</span> : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-center text-[0.65rem] font-bold uppercase text-ink-muted">{player.position}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums">{row.minutes}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums">{row.goals}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums">{row.assists}</td>
                    <td className="px-2 py-2.5 text-center">
                      <span className="inline-flex gap-1">
                        {row.cards.yellow > 0 ? <span className="inline-block h-3 w-2 rounded-sm bg-gold" title={`${row.cards.yellow} amarilla(s)`} /> : null}
                        {row.cards.red > 0 ? <span className="inline-block h-3 w-2 rounded-sm bg-river" title={`${row.cards.red} roja(s)`} /> : null}
                        {row.cards.yellow === 0 && row.cards.red === 0 ? <span className="text-ink-muted/70">—</span> : null}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={`inline-flex min-h-8 min-w-10 items-center justify-center rounded-lg font-display text-base font-bold ${
                          tone === "high"
                            ? "bg-grass text-white"
                            : tone === "mid"
                              ? "bg-gold/25 text-warning-ink"
                              : tone === "low"
                                ? "bg-river text-white"
                                : "bg-paper text-ink-muted"
                        }`}
                      >
                        {formatRating(row.rating)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
