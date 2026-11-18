import Link from "next/link";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { formatPlayerMatchLabel, formatRating } from "@/domain/stats";
import type { Match, Player, Team } from "@/domain/types";
import type { SquadPerformance } from "@/domain/stats";

const POSITION_LABEL: Record<Player["position"], string> = {
  GK: "Arquero",
  DF: "Defensor",
  MF: "Mediocampista",
  FW: "Delantero",
};

export function RosterPage({
  performance,
  matches,
  teams,
  seasonLabel,
}: {
  performance: readonly SquadPerformance[];
  matches: readonly Match[];
  teams: readonly Team[];
  seasonLabel: string;
}) {
  const matchById = new Map(matches.map((match) => [match.id, match]));
  const ratedCount = performance.filter((row) => row.score !== null).length;

  return (
    <div>
      <section className="relative overflow-hidden bg-inverse pb-10 pt-8 text-white md:pb-14 md:pt-10">
        <div className="pointer-events-none absolute inset-0 band-motif" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-16 top-0 h-72 w-72 rounded-full bg-river/25 blur-3xl" aria-hidden="true" />
        <div className="container-page relative">
          <p className="eyebrow text-white/60">
            <span className="mr-2 inline-block h-px w-7 bg-river align-middle" aria-hidden="true" />
            {seasonLabel} · Plantel profesional
          </p>
          <h1 className="mt-3 font-display text-5xl uppercase leading-[0.88] tracking-tight sm:text-6xl">
            El <span className="text-river-ink">plantel</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
            Rendimiento acumulado de cada jugador en los partidos finalizados de River.
            Las notas se expresan en una escala de 1 a 10.
          </p>
        </div>
      </section>

      <main className="container-page py-8 md:py-12">
        <section className="card overflow-hidden" aria-labelledby="plantel-title">
          <div className="flex flex-col gap-3 border-b border-ink/10 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
            <div>
              <p className="eyebrow text-river-ink">Rendimiento</p>
              <h2 id="plantel-title" className="mt-1 font-display text-3xl uppercase">
                Puntaje del plantel
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                Ordenado de mayor a menor. Se evaluaron {ratedCount} de {performance.length} jugadores.
              </p>
            </div>
            <span className="rounded-full bg-river-soft px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-river-ink">
              Partidos finalizados
            </span>
          </div>

          {performance.length === 0 ? (
            <p className="p-6 text-sm text-ink-muted">No hay jugadores disponibles.</p>
          ) : (
            <div className="divide-y divide-ink/10">
              {performance.map((row, index) => (
                <article key={row.playerId} className="p-4 sm:p-5">
                  <div className="grid gap-4 md:grid-cols-[2rem_minmax(0,1fr)_9rem_auto] md:items-center">
                    <span className="font-display text-2xl font-bold text-ink-muted" aria-label={`Posición ${index + 1}`}>
                      {index + 1}
                    </span>
                    <div className="flex min-w-0 items-center gap-3">
                      <PlayerAvatar player={row.player} size="md" />
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-xl uppercase">{row.player.displayName}</h3>
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                          {POSITION_LABEL[row.player.position]} · Dorsal {row.player.shirtNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 md:block md:text-right">
                      <div>
                        <span className="text-[0.62rem] font-bold uppercase tracking-widest text-ink-muted">
                          Puntaje
                        </span>
                        <p className={`font-display text-3xl font-bold ${row.score === null ? "text-ink-muted" : "text-river-ink"}`}>
                          {row.score === null ? "SC" : formatRating(row.score)}
                          {row.score !== null ? <span className="ml-1 text-sm text-ink-muted">/10</span> : null}
                        </p>
                      </div>
                      <p className="text-xs text-ink-muted">
                        {row.ratedMatches} {row.ratedMatches === 1 ? "partido evaluado" : "partidos evaluados"}
                      </p>
                    </div>
                    {row.evaluatedMatchIds.length > 0 ? (
                      <details className="group md:text-right">
                        <summary className="cursor-pointer list-none rounded-full border border-ink/15 px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink-muted transition-colors hover:border-river hover:text-river-ink">
                          Ver partidos
                        </summary>
                        <div className="mt-3 space-y-2 text-left md:absolute md:right-0 md:z-10 md:w-64 md:rounded-xl md:border md:border-ink/10 md:bg-surface md:p-3 md:shadow-xl">
                          {row.evaluatedMatchIds.map((matchId) => {
                            const match = matchById.get(matchId);
                            if (!match) return null;
                            return (
                              <Link
                                key={match.id}
                                href={`/partidos/${match.id}`}
                                className="block rounded-lg border border-ink/10 bg-paper p-3 text-sm transition-colors hover:border-river"
                              >
                                <span className="block font-semibold">
                                  {formatPlayerMatchLabel(match, teams).round}
                                </span>
                                <span className="mt-1 block text-xs font-semibold text-ink">
                                  {formatPlayerMatchLabel(match, teams).fixture}
                                </span>
                                <span className="mt-1 block text-xs text-ink-muted">
                                  {match.score ? `${match.score.home} - ${match.score.away}` : "Ver Match Center"}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </details>
                    ) : (
                      <span className="text-right text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Sin actuaciones calificadas
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
