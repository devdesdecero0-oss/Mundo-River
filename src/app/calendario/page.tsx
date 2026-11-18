import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarView } from "@/components/calendar/calendar-view";
import { matchesRepository } from "@/data/repositories";

export const metadata: Metadata = {
  title: "Calendario y Match Center",
  description:
    "Todos los partidos de River Plate en la temporada, incluidos los amistosos. Filtros por competición, mes y estado.",
  alternates: { canonical: "/calendario" },
};

export default async function CalendarioPage() {
  const [matches, competitions, teams, season] = await Promise.all([
    matchesRepository.listMatches(),
    matchesRepository.getCompetitions(),
    matchesRepository.getTeams(),
    matchesRepository.getSeason(),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-inverse pb-20 pt-10 text-white md:pb-24 md:pt-14">
        <div className="pointer-events-none absolute inset-0 band-motif" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-10 top-0 h-64 w-64 rounded-full bg-river/25 blur-3xl" aria-hidden="true" />
        <div className="container-page relative">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow text-white/55">
                <span className="inline-block h-px w-7 bg-river" aria-hidden="true" />
                {season.label} · Calendario
              </p>
              <h1 className="mt-3 font-display text-5xl uppercase leading-[0.88] tracking-tight sm:text-6xl md:text-7xl">
                La temporada <span className="text-river-ink">completa</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
                Resultados, próximos partidos y estado en vivo. Filtrá por competición, mes o
                estado y abrí la ficha técnica de cada encuentro.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:shrink-0">
              {competitions.map((competition) => (
                <div key={competition.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <dt className="text-[0.58rem] font-bold uppercase tracking-[0.15em] text-white/60">
                    {competition.type === "league"
                      ? "Liga"
                      : competition.type === "international"
                        ? "Internacional"
                        : competition.type === "friendly"
                          ? "Amistoso"
                          : "Copa"}
                  </dt>
                  <dd className="mt-0.5 font-display text-sm uppercase leading-tight">{competition.shortName}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <div className="container-page pb-12 md:pb-16">
        <Suspense fallback={<div className="card -mt-8 h-40 animate-pulse" />}>
          <CalendarView
            matches={matches}
            competitions={competitions}
            teams={teams}
            seasonLabel={season.label}
            nowIso={new Date().toISOString()}
          />
        </Suspense>
      </div>
    </>
  );
}
