import Link from "next/link";
import type { Metadata } from "next";
import { ClubCrest } from "@/components/brand/club-crest";
import { TeamBadge } from "@/components/brand/team-badge";
import { MatchCountdown } from "@/components/match/match-countdown";
import { NewsCard } from "@/components/news/news-card";
import { LocalDate } from "@/components/ui/local-date";
import { MatchStatusBadge } from "@/components/ui/match-status-badge";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { SectionHeading } from "@/components/ui/section-heading";
import { computeMatchMinute, deriveMatchStatus } from "@/domain/matches/status";
import {
  computeForm,
  computeSeasonRecord,
  computeScorers,
  computeAssists,
} from "@/domain/stats";
import { sortNews } from "@/domain/news";
import { getLastResult, getNextMatch, getUpcomingMatches } from "@/domain/matches";
import type { PlayerMatchStats, Team } from "@/domain/types";
import { matchesRepository, newsRepository, squadRepository } from "@/data/repositories";
import { getRequestTimeZone } from "@/lib/time-zone.server";
import { formatLocalDateLong } from "@/domain/time";

const RIVER_TEAM_ID = "river";

export const metadata: Metadata = {
  title: "Inicio",
  description:
    "Próximo partido, último resultado, novedades y los líderes de la temporada de River Plate. Todo en tu zona horaria.",
  alternates: { canonical: "/" },
};

function teamWithFallback(teams: Map<string, Team>, id: string): Team {
  const team = teams.get(id);
  if (team) return team;
  return {
    id,
    name: id,
    shortName: id.slice(0, 3).toUpperCase(),
    crest: "",
    primaryColor: "#0A0A0A",
    secondaryColor: "#E30613",
  };
}

export default async function HomePage() {
  const [matches, articles, competitions, teams, squad, season, timeZone] =
    await Promise.all([
      matchesRepository.listMatches(),
      newsRepository.listArticles(),
      matchesRepository.getCompetitions(),
      matchesRepository.getTeams(),
      squadRepository.getSquad(),
      matchesRepository.getSeason(),
      getRequestTimeZone(),
    ]);
  const playerStats: PlayerMatchStats[] = await matchesRepository.listPlayerStats();

  const now = new Date();
  const nowIso = now.toISOString();

  const teamById = new Map(teams.map((team) => [team.id, team]));
  const competitionById = new Map(
    competitions.map((competition) => [competition.id, competition]),
  );
  const teamOf = (id: string) => teamWithFallback(teamById, id);
  const competitionOf = (id: string) => competitionById.get(id) ?? null;

  const nextMatch = getNextMatch(matches, now);
  const lastResult = getLastResult(matches, now);
  const upcoming = getUpcomingMatches(matches, now, 4);
  const nextStatus = nextMatch ? deriveMatchStatus(nextMatch, now) : null;
  const nextMinute = nextMatch ? computeMatchMinute(nextMatch, now) : null;

  const events = matches.flatMap((match) => match.events);
  const statsOnly = events.length === 0;
  const scorers = computeScorers(squad.players, events, { playerStats, statsOnly });
  const assistants = computeAssists(squad.players, events, { playerStats, statsOnly });
  const scorer = scorers[0] ?? null;
  const assistant = assistants[0] ?? null;
  const record = computeSeasonRecord(matches, RIVER_TEAM_ID);
  const form = computeForm(matches, RIVER_TEAM_ID, 5);
  const latestNews = sortNews(articles).slice(0, 3);
  const [lead, ...secondary] = latestNews;

  return (
    <>
      <section className="relative overflow-hidden bg-inverse text-white">
        <div className="pointer-events-none absolute inset-0 band-motif" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-24 top-1/2 hidden h-[560px] w-[560px] -translate-y-1/2 rotate-[-14deg] opacity-[0.07] lg:block"
          aria-hidden="true"
        >
          <ClubCrest size="hero" decorative className="h-full w-full" />
        </div>
        <div
          className="pointer-events-none absolute -left-40 top-0 h-full w-[45%] -skew-x-12 bg-river/10"
          aria-hidden="true"
        />

        <div className="container-page relative grid gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:py-16">
          <div className="flex flex-col justify-center">
            <p className="eyebrow text-white/60">
              <span className="inline-block h-px w-7 bg-river" aria-hidden="true" />
              {season.label} · La banda, sin filtro
            </p>
            <h1 className="mt-4 font-display text-[3.6rem] uppercase leading-[0.86] tracking-[-0.02em] sm:text-[5rem] lg:text-[5.8rem]">
              Viví River
              <span className="block text-river-ink">en tiempo real</span>
            </h1>
            <p className="mt-5 max-w-lg text-[0.98rem] leading-relaxed text-white/65">
              Novedades, calendario, ficha técnica de cada partido y las calificaciones
              individuales. Toda la temporada, en un solo lugar y en tu zona horaria.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={nextMatch ? `/partidos/${nextMatch.id}` : "/calendario"} className="btn btn-primary">
                {nextStatus === "live" ? "Seguir en vivo" : "Ver el próximo partido"}
                <span aria-hidden="true">→</span>
              </Link>
              <Link href="/novedades" className="btn btn-ghost-light">
                Últimas novedades
              </Link>
            </div>
            <dl className="mt-9 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-5">
              <div>
                <dt className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/60">Puntos</dt>
                <dd className="mt-1 font-display text-3xl font-bold leading-none">{record.points}</dd>
              </div>
              <div>
                <dt className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/60">Efectividad</dt>
                <dd className="mt-1 font-display text-3xl font-bold leading-none">{record.effectiveness}%</dd>
              </div>
              <div>
                <dt className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/60">Goleador</dt>
                <dd className="mt-1 font-display text-xl font-bold leading-tight">
                  {scorer?.player.displayName ?? "—"}{" "}
                  <span className="text-river-ink">{scorer?.goals ?? 0}</span>
                </dd>
              </div>
            </dl>
          </div>

          {nextMatch ? (
            <div className="relative">
              <div className="absolute -left-2 top-6 bottom-6 w-1 rounded-full bg-river" aria-hidden="true" />
              <div className="card relative overflow-hidden border-white/10 bg-white/[0.06] p-5 text-white shadow-2xl backdrop-blur-sm sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="eyebrow text-white/55">
                    {nextStatus === "live" ? "En juego ahora" : "Partido destacado"}
                  </p>
                  {nextStatus ? <MatchStatusBadge status={nextStatus} minute={nextMinute} /> : null}
                </div>

                <p className="mt-4 font-display text-sm uppercase tracking-[0.14em] text-white/55">
                  {competitionOf(nextMatch.competitionId)?.name ?? "Temporada"} · {nextMatch.round}
                </p>

                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <TeamBadge team={teamOf(nextMatch.homeTeamId)} size="lg" />
                    <span className="font-display text-lg uppercase leading-tight">
                      {teamOf(nextMatch.homeTeamId).name}
                    </span>
                  </div>
                  <div className="text-center">
                    {nextMatch.score && nextStatus !== "scheduled" ? (
                      <p className="font-display text-5xl font-bold leading-none tabular-nums">
                        {nextMatch.score.home}
                        <span className="mx-1 text-white/35">-</span>
                        {nextMatch.score.away}
                      </p>
                    ) : (
                      <p className="font-display text-2xl font-semibold uppercase text-white/45">vs</p>
                    )}
                    {nextStatus === "live" && nextMinute ? (
                      <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-river px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest">
                        <span className="h-1.5 w-1.5 animate-live rounded-full bg-white" aria-hidden="true" />
                        {nextMinute}&apos;
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <TeamBadge team={teamOf(nextMatch.awayTeamId)} size="lg" />
                    <span className="font-display text-lg uppercase leading-tight">
                      {teamOf(nextMatch.awayTeamId).name}
                    </span>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3.5">
                  {nextStatus === "scheduled" ? (
                    <>
                      <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/60">
                        Comienza en
                      </p>
                      <MatchCountdown target={nextMatch.kickoffAt} initialNow={nowIso} />
                    </>
                  ) : (
                    <p className="text-sm text-white/70">
                      {nextStatus === "live"
                        ? "Marcador en vivo. Abrí la ficha para seguir las incidencias minuto a minuto."
                        : "El partido está en juego. Consultá la ficha completa."}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-white/60">
                  <LocalDate value={nextMatch.kickoffAt} variant="datetime" className="font-semibold text-white/80" />
                  <span>{nextMatch.venue}</span>
                </div>

                <Link
                  href={`/partidos/${nextMatch.id}`}
                  className="btn btn-primary mt-5 w-full"
                >
                  Abrir Match Center
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="card bg-white/[0.06] p-6 text-white">
              <p className="eyebrow text-white/55">Sin partidos próximos</p>
              <p className="mt-3 font-display text-3xl uppercase">La temporada sigue en el calendario</p>
              <Link href="/calendario" className="btn btn-primary mt-5">
                Ver calendario
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-ink/10 bg-surface" aria-label="Resumen de la temporada">
        <div className="container-page grid grid-cols-2 divide-x divide-ink/10 md:grid-cols-4">
          <div className="px-3 py-4 sm:px-5">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-muted">Registro</p>
            <p className="mt-1 font-display text-xl font-semibold uppercase">
              {record.won}G · {record.drawn}E · {record.lost}P
            </p>
          </div>
          <div className="px-3 py-4 sm:px-5">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-muted">Diferencia de gol</p>
            <p className="mt-1 font-display text-xl font-semibold uppercase">
              {record.goalDiff > 0 ? "+" : ""}
              {record.goalDiff} <span className="text-ink-muted">({record.goalsFor}-{record.goalsAgainst})</span>
            </p>
          </div>
          <div className="px-3 py-4 sm:px-5">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-muted">Racha</p>
            <div className="mt-1.5 flex gap-1.5" aria-label="Últimos cinco resultados">
              {form.map((result, index) => (
                <span
                  key={`${result}-${index}`}
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[0.66rem] font-bold text-white ${
                    result === "W" ? "bg-grass" : result === "D" ? "bg-inverse-muted" : "bg-river"
                  }`}
                  title={result === "W" ? "Victoria" : result === "D" ? "Empate" : "Derrota"}
                >
                  {result}
                </span>
              ))}
            </div>
          </div>
          <div className="px-3 py-4 sm:px-5">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-muted">Asistencias</p>
            <p className="mt-1 font-display text-xl font-semibold uppercase">
              {assistant?.player.displayName ?? "—"} <span className="text-river-ink">{assistant?.assists ?? 0}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-12 md:py-16" aria-labelledby="novedades-home">
        <SectionHeading
          eyebrow="Novedades"
          title="Lo último de River"
          description="Plantel, inferiores, institucional y mercado de pases. Ordenado por lo más reciente."
          href="/novedades"
          actionLabel="Ver todas"
        />

        {lead ? (
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 lg:row-span-2">
              <NewsCard article={lead} featured priority />
            </div>
            {secondary.map((article) => (
              <div key={article.id}>
                <NewsCard article={article} />
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="border-y border-ink/10 bg-surface py-12 md:py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <SectionHeading
              eyebrow="Calendario"
              title="Lo que viene"
              href="/calendario"
              actionLabel="Temporada completa"
            />
            <div className="mt-6 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-paper">
              {upcoming.length > 0 ? (
                upcoming.map((match) => (
                  <Link
                    key={match.id}
                    href={`/partidos/${match.id}`}
                    className="group flex items-center gap-3 p-3.5 transition-colors hover:bg-surface sm:gap-4 sm:p-4"
                  >
                    <div className="w-16 shrink-0 text-center">
                      <LocalDate value={match.kickoffAt} variant="short" className="block text-[0.66rem] font-bold uppercase tracking-wide text-ink-muted" />
                      <LocalDate value={match.kickoffAt} variant="time" className="mt-0.5 block font-display text-lg font-bold" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-base uppercase sm:text-lg">
                        {teamOf(match.homeTeamId).shortName} <span className="text-ink-muted">vs</span>{" "}
                        {teamOf(match.awayTeamId).shortName}
                      </p>
                      <p className="truncate text-xs text-ink-muted">
                        {competitionOf(match.competitionId)?.shortName} · {match.venue}
                      </p>
                    </div>
                    <span className="hidden rounded-full border border-ink/15 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-ink-muted sm:inline-flex">
                      Próximo
                    </span>
                    <span className="text-river-ink transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                  </Link>
                ))
              ) : (
                <p className="p-5 text-sm text-ink-muted">No hay partidos programados por ahora.</p>
              )}
            </div>

            {lastResult ? (
              <div className="mt-5">
                <p className="eyebrow text-ink-muted">Último resultado</p>
                <Link
                  href={`/partidos/${lastResult.id}`}
                  className="card card-hover mt-2 flex flex-wrap items-center gap-4 p-4"
                >
                  <div className="flex items-center gap-2">
                    <TeamBadge team={teamOf(lastResult.homeTeamId)} size="sm" />
                    <span className="font-display text-lg font-bold">
                      {lastResult.score?.home} - {lastResult.score?.away}
                    </span>
                    <TeamBadge team={teamOf(lastResult.awayTeamId)} size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display uppercase leading-tight">
                      {teamOf(lastResult.homeTeamId).name} vs {teamOf(lastResult.awayTeamId).name}
                    </p>
                    <p className="text-xs text-ink-muted">
                      <LocalDate value={lastResult.kickoffAt} variant="datetime" /> ·{" "}
                      {competitionOf(lastResult.competitionId)?.shortName}
                    </p>
                  </div>
                  <span className="text-river-ink" aria-hidden="true">→</span>
                </Link>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-4">
            <div className="card bg-inverse p-5 text-white sm:p-6">
              <p className="eyebrow text-white/50">Temporada en números</p>
              <p className="mt-3 font-display text-4xl uppercase leading-none">
                {record.points} <span className="text-xl text-white/50">puntos</span>
              </p>
              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-center">
                <div>
                  <dt className="text-[0.6rem] uppercase tracking-widest text-white/60">PJ</dt>
                  <dd className="font-display text-2xl font-bold">{record.played}</dd>
                </div>
                <div>
                  <dt className="text-[0.6rem] uppercase tracking-widest text-white/60">GF</dt>
                  <dd className="font-display text-2xl font-bold">{record.goalsFor}</dd>
                </div>
                <div>
                  <dt className="text-[0.6rem] uppercase tracking-widest text-white/60">GC</dt>
                  <dd className="font-display text-2xl font-bold">{record.goalsAgainst}</dd>
                </div>
              </dl>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-[0.62rem] font-bold uppercase tracking-widest text-white/60">Últimos 5</span>
                <div className="flex gap-1.5">
                  {form.map((result, index) => (
                    <span
                      key={`${result}-${index}`}
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.6rem] font-bold text-white ${
                        result === "W" ? "bg-grass" : result === "D" ? "bg-white/25" : "bg-river"
                      }`}
                    >
                      {result}
                    </span>
                  ))}
                </div>
              </div>
              <Link href="/temporada" className="btn btn-ghost-light mt-5 w-full text-sm">
                Ver la temporada
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {scorer ? (
                <Link href="/temporada" className="card card-hover flex items-center gap-3 p-4">
                  <PlayerAvatar player={scorer.player} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.6rem] font-bold uppercase tracking-widest text-river-ink">Goleador</p>
                    <p className="truncate font-display text-lg uppercase leading-tight">{scorer.player.displayName}</p>
                    <p className="text-xs text-ink-muted">{scorer.goals} goles · {scorer.assists} asistencias</p>
                  </div>
                  <span className="font-display text-3xl font-bold text-ink/35">{scorer.goals}</span>
                </Link>
              ) : null}
              {assistant ? (
                <Link href="/temporada" className="card card-hover flex items-center gap-3 p-4">
                  <PlayerAvatar player={assistant.player} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.6rem] font-bold uppercase tracking-widest text-river-ink">Asistidor</p>
                    <p className="truncate font-display text-lg uppercase leading-tight">{assistant.player.displayName}</p>
                    <p className="text-xs text-ink-muted">{assistant.assists} asistencias · {assistant.goals} goles</p>
                  </div>
                  <span className="font-display text-3xl font-bold text-ink/35">{assistant.assists}</span>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-12 md:py-16">
        <div className="relative overflow-hidden rounded-3xl red-band px-6 py-10 text-white sm:px-10">
          <div className="pointer-events-none absolute inset-0 band-motif" aria-hidden="true" />
          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="eyebrow text-white/70">Match Center</p>
              <h2 className="mt-2 max-w-2xl font-display text-3xl uppercase leading-[0.95] sm:text-4xl">
                Incidencias, estadísticas y la nota de cada jugador
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">
                Después de cada partido, la ficha técnica completa. Antes, todo lo que necesitás
                saber. Al minuto, en cualquier dispositivo.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link href="/calendario" className="btn bg-white text-on-light hover:bg-white/90">
                Ver calendario
              </Link>
              <Link href="/temporada" className="btn btn-ghost-light">
                Estadísticas
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-[0.7rem] text-ink-muted">
          Fechas mostradas en tu zona horaria · Actualizado al{" "}
          {formatLocalDateLong(nowIso, timeZone)}
        </p>
      </section>
    </>
  );
}
