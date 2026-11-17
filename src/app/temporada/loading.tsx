export default function SeasonLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando la temporada</span>
      <div className="bg-inverse pb-10 pt-8 text-white md:pb-14">
        <div className="container-page">
          <div className="h-3 w-48 animate-pulse rounded-full bg-white/15" />
          <div className="mt-4 h-14 w-3/4 animate-pulse rounded-lg bg-white/15" />
          <div className="mt-4 h-4 w-1/2 animate-pulse rounded-full bg-white/10" />
          <div className="mt-7 flex gap-2">
            <div className="h-11 w-20 animate-pulse rounded-full bg-white/15" />
            <div className="h-11 w-24 animate-pulse rounded-full bg-white/10" />
            <div className="h-11 w-28 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      </div>
      <div className="container-page py-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-40 animate-pulse rounded-2xl bg-ink/10" />
          <div className="h-40 animate-pulse rounded-2xl bg-ink/10" />
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl bg-ink/10" />
          <div className="h-80 animate-pulse rounded-2xl bg-ink/10" />
        </div>
      </div>
    </div>
  );
}
