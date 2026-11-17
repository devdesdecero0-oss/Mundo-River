"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import {
  computeAssists,
  computeForm,
  computePlayerSeasonTotals,
  computeScorers,
  computeSeasonRecord,
  computeSplit,
  formatRating,
} from "@/domain/stats";
import type {
  Competition,
  FormResult,
  Match,
  Player,
  PlayerMatchStats,
  PlayerSeasonTotals,
  RankingEntry,
  SeasonRecord,
} from "@/domain/types";

const ALL_COMPETITIONS = "all";
const POSITION_LABEL: Record<Player["position"], string> = {
  GK: "Arquero",
  DF: "Defensor",
  MF: "Mediocampista",
  FW: "Delantero",
};

interface SeasonDashboardProps {
  matches: Match[];
  competitions: Competition[];
  players: Player[];
  playerStats: PlayerMatchStats[];
  seasonLabel: string;
}

export function SeasonDashboard({
  matches,
  competitions,
  players,
  playerStats,
  seasonLabel,
}: SeasonDashboardProps) {
  const [competitionId, setCompetitionId] = useState(ALL_COMPETITIONS);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const filteredMatches = useMemo(
    () =>
      competitionId === ALL_COMPETITIONS
        ? matches
        : matches.filter((match) => match.competitionId === competitionId),
    [matches, competitionId],
  );

  const filteredMatchIds = useMemo(
    () => new Set(filteredMatches.map((match) => match.id)),
    [filteredMatches],
  );

  const filteredEvents = useMemo(
    () => filteredMatches.flatMap((match) => match.events),
    [filteredMatches],
  );

  const filteredStats = useMemo(
    () => playerStats.filter((stats) => filteredMatchIds.has(stats.matchId)),
    [playerStats, filteredMatchIds],
  );

  // El proveedor puede no entregar incidencias: en ese caso los totales se
  // derivan de las estadísticas individuales para no mostrar rankings vacíos.
  const statsOnly = filteredEvents.length === 0 && filteredStats.length > 0;

  const rankingOptions = useMemo(
    () => ({
      matchIds: [...filteredMatchIds],
      playerStats: filteredStats,
      statsOnly,
    }),
    [filteredMatchIds, filteredStats, statsOnly],
  );

  const scorers = useMemo(
    () => computeScorers(players, filteredEvents, rankingOptions),
    [players, filteredEvents, rankingOptions],
  );

  const assistants = useMemo(
    () => computeAssists(players, filteredEvents, rankingOptions),
    [players, filteredEvents, rankingOptions],
  );

  const record = useMemo(
    () => computeSeasonRecord(filteredMatches, "river"),
    [filteredMatches],
  );
  const split = useMemo(() => computeSplit(filteredMatches, "river"), [filteredMatches]);
  const form = useMemo(() => computeForm(filteredMatches, "river", 5), [filteredMatches]);

  const scorerLeader = scorers[0] ?? null;
  const assistantLeader = assistants[0] ?? null;

  const scorerTotals = useMemo(
    () => totalsFor(scorerLeader?.playerId, filteredEvents, filteredStats, statsOnly),
    [scorerLeader?.playerId, filteredEvents, filteredStats, statsOnly],
  );
  const assistantTotals = useMemo(
    () => totalsFor(assistantLeader?.playerId, filteredEvents, filteredStats, statsOnly),
    [assistantLeader?.playerId, filteredEvents, filteredStats, statsOnly],
  );

  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId],
  );
  const selectedTotals = useMemo(
    () => totalsFor(selectedPlayerId, filteredEvents, filteredStats, statsOnly),
    [selectedPlayerId, filteredEvents, filteredStats, statsOnly],
  );

  useEffect(() => {
    if (!selectedPlayer) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedPlayerId(null);
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus();
    };
  }, [selectedPlayer]);

  const competitionName =
    competitionId === ALL_COMPETITIONS
      ? "Todas las competiciones"
      : competitions.find((competition) => competition.id === competitionId)?.name ??
        "Competición";

  return (
    <div>
      <section className="relative overflow-hidden bg-inverse pb-10 pt-8 text-white md:pb-14 md:pt-10">
        <div className="pointer-events-none absolute inset-0 band-motif" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-16 top-0 h-72 w-72 rounded-full bg-river/25 blur-3xl" aria-hidden="true" />
        <div className="container-page relative">
          <p className="eyebrow text-white/55">
            <span className="inline-block h-px w-7 bg-river" aria-hidden="true" />
            {seasonLabel} · Ficha histórica
          </p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="font-display text-5xl uppercase leading-[0.88] tracking-tight sm:text-6xl">
                La temporada <span className="text-river-ink">en números</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
                Goleadores, asistentes, registro del equipo, racha y rendimiento como local y
                visitante. Todo derivado de las mismas fichas de partido.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 lg:min-w-64">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white/60">
                Puntos
              </p>
              <p className="mt-1 font-display text-4xl font-bold leading-none">
                {record.points}
                <span className="ml-2 text-base font-semibold text-white/60">
                  en {record.played} PJ
                </span>
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-river-ink">
                {record.effectiveness}% de efectividad
              </p>
            </div>
          </div>

          <div className="mt-7">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/60">
              Filtrar por competición
            </p>
            <div
              className="scrollbar-thin mt-2 flex gap-2 overflow-x-auto pb-1"
              role="group"
              aria-label="Filtrar la temporada por competición"
            >
              <FilterChip
                active={competitionId === ALL_COMPETITIONS}
                onClick={() => setCompetitionId(ALL_COMPETITIONS)}
              >
                Todas
              </FilterChip>
              {competitions.map((competition) => (
                <FilterChip
                  key={competition.id}
                  active={competitionId === competition.id}
                  onClick={() => setCompetitionId(competition.id)}
                >
                  {competition.shortName}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container-page py-8 md:py-12">
        <p className="mb-5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Mostrando <span className="text-ink">{competitionName}</span> · {record.played} partidos
          finalizados
        </p>

        <section aria-labelledby="lideres-temporada">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow text-river-ink">Líderes</p>
              <h2 id="lideres-temporada" className="mt-1 font-display text-3xl uppercase">
                Los números uno
              </h2>
            </div>
            {scorerLeader?.isTied || assistantLeader?.isTied ? (
              <p className="max-w-xs text-right text-[0.68rem] font-semibold uppercase tracking-wide text-ink-muted">
                Empate técnico en la cima · se aplica el desempate R-RANK
              </p>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <LeaderCard
              eyebrow="Máximo goleador"
              player={scorerLeader?.player ?? null}
              metric={scorerLeader?.value ?? 0}
              metricLabel="goles"
              secondary={countLabel(scorerLeader?.assists ?? 0, "asistencia", "asistencias")}
              totals={scorerTotals}
              accent="river"
              onOpen={scorerLeader ? () => setSelectedPlayerId(scorerLeader.playerId) : undefined}
            />
            <LeaderCard
              eyebrow="Máximo asistente"
              player={assistantLeader?.player ?? null}
              metric={assistantLeader?.value ?? 0}
              metricLabel="asistencias"
              secondary={countLabel(assistantLeader?.goals ?? 0, "gol", "goles")}
              totals={assistantTotals}
              accent="ink"
              onOpen={
                assistantLeader ? () => setSelectedPlayerId(assistantLeader.playerId) : undefined
              }
            />
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2" aria-label="Rankings de la temporada">
          <RankingList
            title="Top 5 goleadores"
            eyebrow="Goles"
            entries={scorers.slice(0, 5)}
            metric="goals"
            emptyText="Todavía no hay goles registrados en esta competición."
            onSelect={setSelectedPlayerId}
          />
          <RankingList
            title="Top 5 asistentes"
            eyebrow="Asistencias"
            entries={assistants.slice(0, 5)}
            metric="assists"
            emptyText="Todavía no hay asistencias registradas en esta competición."
            onSelect={setSelectedPlayerId}
          />
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]" aria-label="Registro y racha">
          <div className="card overflow-hidden">
            <div className="flex items-end justify-between gap-3 border-b border-ink/10 p-5">
              <div>
                <p className="eyebrow text-river-ink">Registro</p>
                <h2 className="mt-1 font-display text-3xl uppercase">Campaña de River</h2>
              </div>
              <p className="text-right text-[0.65rem] font-bold uppercase tracking-wide text-ink-muted">
                {record.won}G · {record.drawn}E · {record.lost}P
              </p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-ink/10 sm:grid-cols-4">
              <RecordStat label="Partidos jugados" value={record.played} />
              <RecordStat label="Ganados" value={record.won} />
              <RecordStat label="Empatados" value={record.drawn} />
              <RecordStat label="Perdidos" value={record.lost} />
              <RecordStat label="Goles a favor" value={record.goalsFor} />
              <RecordStat label="Goles en contra" value={record.goalsAgainst} />
              <RecordStat
                label="Diferencia de gol"
                value={`${record.goalDiff > 0 ? "+" : ""}${record.goalDiff}`}
              />
              <RecordStat label="Puntos" value={record.points} />
            </div>
            <div className="border-t border-ink/10 p-5">
              <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wide text-ink-muted">
                <span>Efectividad</span>
                <span className="text-ink">{record.effectiveness}%</span>
              </div>
              <div
                className="mt-2 h-2.5 overflow-hidden rounded-full bg-paper-deep"
                role="img"
                aria-label={`Efectividad de River: ${record.effectiveness}%`}
              >
                <span
                  className="block h-full rounded-full bg-river"
                  style={{ width: `${Math.min(100, Math.max(0, record.effectiveness))}%` }}
                />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                Puntos obtenidos sobre el máximo posible en los {record.played} partidos
                finalizados de {competitionName.toLowerCase()}.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="card p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="eyebrow text-river-ink">Racha</p>
                  <h2 className="mt-1 font-display text-2xl uppercase">
                    {streakLabel(form)}
                  </h2>
                </div>
                <span className="rounded-full bg-strong px-3 py-1 font-display text-xs font-bold uppercase tracking-wide text-on-strong">
                  Últimos 5
                </span>
              </div>
              <ol className="mt-4 flex items-center gap-2" aria-label="Últimos cinco resultados, del más antiguo al más reciente">
                {form.length > 0 ? (
                  [...form].reverse().map((result, index) => (
                    <li key={`${result}-${index}`} className="flex items-center gap-2">
                      <FormBadge result={result} />
                      {index < form.length - 1 ? (
                        <span className="h-px w-4 bg-ink/15" aria-hidden="true" />
                      ) : null}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-ink-muted">Sin partidos finalizados.</li>
                )}
              </ol>
              <p className="mt-3 text-xs text-ink-muted">
                De izquierda a derecha: del más antiguo al más reciente. G = victoria, E = empate,
                P = derrota.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SplitCard title="Como local" record={split.home} />
              <SplitCard title="Como visitante" record={split.away} />
            </div>
          </div>
        </section>

        <p className="mt-8 text-center text-[0.7rem] leading-relaxed text-ink-muted">
          Los totales se calculan con los mismos eventos y estadísticas de las fichas de partido.
          Seleccioná un jugador para ver su panel completo.
        </p>
      </div>

      {selectedPlayer && selectedTotals ? (
        <PlayerPanel
          player={selectedPlayer}
          totals={selectedTotals}
          panelRef={panelRef}
          closeButtonRef={closeButtonRef}
          onClose={() => setSelectedPlayerId(null)}
        />
      ) : null}
    </div>
  );
}

function totalsFor(
  playerId: string | null | undefined,
  events: Match["events"],
  playerStats: PlayerMatchStats[],
  statsOnly: boolean,
): PlayerSeasonTotals | null {
  if (!playerId) return null;
  return computePlayerSeasonTotals({ playerId, events, playerStats, statsOnly });
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 shrink-0 rounded-full border px-3.5 text-xs font-bold uppercase tracking-wide transition-colors ${
        active
          ? "border-white bg-white text-on-light"
          : "border-white/20 text-white/70 hover:border-white/50 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function LeaderCard({
  eyebrow,
  player,
  metric,
  metricLabel,
  secondary,
  totals,
  accent,
  onOpen,
}: {
  eyebrow: string;
  player: Player | null;
  metric: number;
  metricLabel: string;
  secondary: string;
  totals: PlayerSeasonTotals | null;
  accent: "river" | "ink";
  onOpen?: () => void;
}) {
  const surface = accent === "river" ? "red-band text-white" : "bg-inverse text-white";

  if (!player) {
    return (
      <div className="card p-6">
        <p className="eyebrow text-ink-muted">{eyebrow}</p>
        <p className="mt-3 font-display text-2xl uppercase">Sin datos todavía</p>
        <p className="mt-1 text-sm text-ink-muted">
          No hay {metricLabel} registradas en esta competición.
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative overflow-hidden rounded-2xl p-5 text-left shadow-card sm:p-6 ${surface}`}
      aria-label={`Ver panel de ${player.displayName}, ${metric} ${metricLabel}`}
    >
      <div className="pointer-events-none absolute inset-0 band-motif" aria-hidden="true" />
      <div className="relative flex items-start gap-4">
        <PlayerAvatar player={player} size="lg" className="ring-2 ring-white/30" />
        <div className="min-w-0 flex-1">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white/60">
            {eyebrow}
          </p>
          <p className="mt-1 font-display text-[1.65rem] uppercase leading-[0.95] sm:text-3xl">
            {player.displayName}
          </p>
          <p className="mt-1.5 text-xs font-semibold text-white/70">
            {POSITION_LABEL[player.position]} · Dorsal {player.shirtNumber}
          </p>
          <p className="mt-2 text-xs text-white/65">
            {secondary} · {totals?.appearances ?? 0} PJ
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-5xl font-bold leading-none">{metric}</p>
          <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-white/60">
            {metricLabel}
          </p>
        </div>
      </div>
      <span className="relative mt-4 inline-flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-wide text-white/70 group-hover:text-white">
        Ver panel del jugador <span aria-hidden="true">→</span>
      </span>
    </button>
  );
}

function RankingList({
  title,
  eyebrow,
  entries,
  metric,
  emptyText,
  onSelect,
}: {
  title: string;
  eyebrow: string;
  entries: RankingEntry[];
  metric: "goals" | "assists";
  emptyText: string;
  onSelect: (playerId: string) => void;
}) {
  const max = entries[0]?.value ?? 0;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-end justify-between gap-3 border-b border-ink/10 p-5">
        <div>
          <p className="eyebrow text-river-ink">{eyebrow}</p>
          <h2 className="mt-1 font-display text-2xl uppercase">{title}</h2>
        </div>
        <span className="text-[0.62rem] font-bold uppercase tracking-wide text-ink-muted">
          Top {Math.max(entries.length, 5)}
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="p-5 text-sm text-ink-muted">{emptyText}</p>
      ) : (
        <ol className="divide-y divide-ink/10">
          {entries.map((entry, index) => {
            const value = metric === "goals" ? entry.goals : entry.assists;
            const other = metric === "goals" ? entry.assists : entry.goals;
            const width = max === 0 ? 0 : Math.max(4, Math.round((value / max) * 100));
            return (
              <li key={entry.playerId}>
                <button
                  type="button"
                  onClick={() => onSelect(entry.playerId)}
                  className="group flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-paper/70"
                  aria-label={`Ver panel de ${entry.player.displayName}: ${value} ${metric === "goals" ? "goles" : "asistencias"}`}
                >
                  <span className="w-5 shrink-0 text-center font-display text-sm font-bold text-ink-muted">
                    {index + 1}
                  </span>
                  <PlayerAvatar player={entry.player} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-semibold">{entry.player.displayName}</span>
                      {entry.isTied ? (
                        <span className="shrink-0 rounded bg-gold/25 px-1 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide text-warning-ink">
                          Empate
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-deep">
                        <span
                          className="block h-full rounded-full bg-river"
                          style={{ width: `${width}%` }}
                        />
                      </span>
                      <span className="shrink-0 text-[0.62rem] font-semibold uppercase tracking-wide text-ink-muted">
                        {other} {metric === "goals" ? "asist." : "goles"} · {entry.minutes} min
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 font-display text-2xl font-bold tabular-nums text-ink">
                    {value}
                  </span>
                  <span className="text-river-ink transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                    →
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function RecordStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="p-4">
      <p className="text-[0.58rem] font-bold uppercase leading-tight tracking-[0.14em] text-ink-muted">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function SplitCard({ title, record }: { title: string; record: SeasonRecord }) {
  return (
    <div className="card p-4">
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-ink-muted">{title}</p>
      <p className="mt-1 font-display text-2xl uppercase">
        {record.won}G · {record.drawn}E · {record.lost}P
      </p>
      <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
        <span>{record.played} PJ</span>
        <span>
          {record.goalsFor}-{record.goalsAgainst}
        </span>
        <span className="font-bold text-ink">{record.points} pts</span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-deep"
        role="img"
        aria-label={`${title}: ${record.effectiveness}% de efectividad`}
      >
        <span
          className="block h-full rounded-full bg-ink"
          style={{ width: `${Math.min(100, Math.max(0, record.effectiveness))}%` }}
        />
      </div>
    </div>
  );
}

function FormBadge({ result }: { result: FormResult }) {
  const label = result === "W" ? "Victoria" : result === "D" ? "Empate" : "Derrota";
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-bold text-white ${
        result === "W" ? "bg-grass" : result === "D" ? "bg-ink-muted" : "bg-river"
      }`}
      title={label}
      aria-label={label}
    >
      {result}
    </span>
  );
}

function PlayerPanel({
  player,
  totals,
  panelRef,
  closeButtonRef,
  onClose,
}: {
  player: Player;
  totals: PlayerSeasonTotals;
  panelRef: RefObject<HTMLDivElement | null>;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-inverse/55 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-jugador-titulo"
        className="h-full w-full max-w-md overflow-y-auto bg-surface shadow-2xl animate-rise"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-ink/10 bg-surface/95 px-5 py-3 backdrop-blur">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-ink-muted">
            Panel del jugador
          </p>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-ink/15 text-ink-muted hover:bg-paper hover:text-ink"
            aria-label="Cerrar panel del jugador"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ×
            </span>
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <PlayerAvatar player={player} size="xl" />
            <div className="min-w-0">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-river-ink">
                {POSITION_LABEL[player.position]}
                {player.isCaptain ? " · Capitán" : ""}
              </p>
              <h2
                id="panel-jugador-titulo"
                className="mt-1 font-display text-3xl uppercase leading-none"
              >
                {player.displayName}
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                Dorsal {player.shirtNumber} · {player.nationality}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <PanelStat label="Partidos" value={totals.appearances} />
            <PanelStat label="Minutos" value={totals.minutes} />
            <PanelStat label="Goles" value={totals.goals} accent />
            <PanelStat label="Asistencias" value={totals.assists} accent />
            <PanelStat label="Amarillas" value={totals.yellowCards} />
            <PanelStat label="Rojas" value={totals.redCards} />
          </div>

          <div className="mt-5 rounded-2xl bg-inverse p-5 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white/60">
                  Calificación media
                </p>
                <p className="mt-1 text-xs text-white/60">
                  Promedio de las notas editoriales del partido.
                </p>
              </div>
              <p className="font-display text-5xl font-bold leading-none">
                {formatRating(totals.averageRating)}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-ink/10 bg-paper p-4 text-xs leading-relaxed text-ink-muted">
            Los totales corresponden a la competición seleccionada y se calculan con los mismos
            eventos y estadísticas de las fichas de cada partido.
          </div>

          <button type="button" onClick={onClose} className="btn btn-outline mt-5 w-full">
            Volver a la temporada
          </button>
        </div>
      </div>
    </div>
  );
}

function PanelStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3 ${accent ? "border-river/20 bg-river-soft/50" : "border-ink/10 bg-paper"}`}>
      <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <p className="mt-0.5 font-display text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function streakLabel(form: FormResult[]): string {
  const first = form[0];
  if (!first) return "Sin racha todavía";
  let count = 0;
  for (const result of form) {
    if (result !== first) break;
    count += 1;
  }
  if (first === "W") return `${count} ${count === 1 ? "victoria seguida" : "victorias seguidas"}`;
  if (first === "D") return `${count} ${count === 1 ? "empate seguido" : "empates seguidos"}`;
  return `${count} ${count === 1 ? "derrota seguida" : "derrotas seguidas"}`;
}
