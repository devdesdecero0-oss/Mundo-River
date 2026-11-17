import type { LigaProfesionalStandings, StandingRow } from "@/domain/standings";

export function LigaProfesionalPage({ standings }: { standings: LigaProfesionalStandings }) {
  const riverAnnual = standings.annual.find((row) => row.teamId === "river");

  return (
    <div>
      <section className="relative overflow-hidden bg-inverse pb-10 pt-8 text-white md:pb-14 md:pt-10">
        <div className="pointer-events-none absolute inset-0 band-motif" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-16 top-0 h-72 w-72 rounded-full bg-river/25 blur-3xl" aria-hidden="true" />
        <div className="container-page relative">
          <p className="eyebrow text-white/60">
            <span className="mr-2 inline-block h-px w-7 bg-river align-middle" aria-hidden="true" />
            {standings.seasonLabel} · Competición
          </p>
          <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="font-display text-5xl uppercase leading-[0.88] tracking-tight sm:text-6xl">
                Liga <span className="text-river-ink">Profesional</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
                La tabla anual y el grupo de River, actualizados con los datos oficiales de la
                competencia.
              </p>
            </div>
            {riverAnnual ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 lg:min-w-64">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white/60">
                  River en la tabla anual
                </p>
                <p className="mt-1 font-display text-4xl font-bold leading-none">
                  {riverAnnual.position}°
                  <span className="ml-2 text-base font-semibold text-white/60">
                    · {riverAnnual.points} pts
                  </span>
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <main className="container-page space-y-8 py-8 md:py-12">
        <StandingTable
          title="Tabla anual"
          description="Partidos finalizados de las fases regulares de la temporada."
          rows={standings.annual}
        />

        {standings.riverGroup ? (
          <StandingTable
            title={`Grupo de River · ${formatGroupName(standings.riverGroup.name)}`}
            description="Posiciones oficiales del grupo al que pertenece River."
            rows={standings.riverGroup.rows}
          />
        ) : (
          <section className="card p-6">
            <p className="eyebrow text-river-ink">Grupo de River</p>
            <h2 className="mt-1 font-display text-3xl uppercase">Sin tabla disponible</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Bzzoiro todavía no informó el grupo correspondiente para River.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function StandingTable({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: readonly StandingRow[];
}) {
  return (
    <section className="card overflow-hidden" aria-labelledby={slugify(title)}>
      <div className="border-b border-ink/10 p-5 sm:p-6">
        <p className="eyebrow text-river-ink">Posiciones</p>
        <h2 id={slugify(title)} className="mt-1 font-display text-3xl uppercase">
          {title}
        </h2>
        <p className="mt-2 text-sm text-ink-muted">{description}</p>
      </div>

      {rows.length === 0 ? (
        <p className="p-6 text-sm text-ink-muted">Todavía no hay posiciones disponibles.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <caption className="sr-only">{title}</caption>
            <thead className="bg-paper text-left text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink-muted">
              <tr>
                <th scope="col" className="w-12 px-3 py-3 text-center">#</th>
                <th scope="col" className="px-3 py-3">Equipo</th>
                <th scope="col" className="px-3 py-3 text-center">PJ</th>
                <th scope="col" className="px-3 py-3 text-center">G</th>
                <th scope="col" className="px-3 py-3 text-center">E</th>
                <th scope="col" className="px-3 py-3 text-center">P</th>
                <th scope="col" className="px-3 py-3 text-center">GF</th>
                <th scope="col" className="px-3 py-3 text-center">GC</th>
                <th scope="col" className="px-3 py-3 text-center">DG</th>
                <th scope="col" className="px-4 py-3 text-center">PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {rows.map((row) => (
                <tr
                  key={row.teamId}
                  className={row.teamId === "river" ? "bg-river-soft/70 font-semibold" : ""}
                >
                  <td className="px-3 py-3 text-center font-display text-lg font-bold text-ink-muted">
                    {row.position}
                  </td>
                  <th scope="row" className="whitespace-nowrap px-3 py-3 text-left">
                    <span className="flex items-center gap-2">
                      {row.teamId === "river" ? (
                        <span className="h-2 w-2 rounded-full bg-river" aria-label="River Plate" />
                      ) : null}
                      {row.teamName}
                    </span>
                  </th>
                  <td className="px-3 py-3 text-center tabular-nums">{row.played}</td>
                  <td className="px-3 py-3 text-center tabular-nums">{row.won}</td>
                  <td className="px-3 py-3 text-center tabular-nums">{row.drawn}</td>
                  <td className="px-3 py-3 text-center tabular-nums">{row.lost}</td>
                  <td className="px-3 py-3 text-center tabular-nums">{row.goalsFor}</td>
                  <td className="px-3 py-3 text-center tabular-nums">{row.goalsAgainst}</td>
                  <td className="px-3 py-3 text-center tabular-nums">
                    {row.goalDifference > 0 ? "+" : ""}
                    {row.goalDifference}
                  </td>
                  <td className="px-4 py-3 text-center font-display text-xl font-bold tabular-nums">
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatGroupName(value: string): string {
  return value.replace(/group/gi, "Grupo");
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
