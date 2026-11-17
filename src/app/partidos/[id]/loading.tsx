export default function MatchLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando Match Center</span>
      <div className="bg-ink pb-10 pt-8 text-white md:pb-14">
        <div className="container-page">
          <div className="h-3 w-40 animate-pulse rounded-full bg-white/15" />
          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-white/15" />
            <div className="h-14 w-28 animate-pulse rounded-lg bg-white/15" />
            <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-white/15" />
          </div>
          <div className="mt-8 h-4 w-2/3 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>
      <div className="container-page py-6">
        <div className="h-10 w-full animate-pulse rounded-lg bg-ink/10" />
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="h-96 animate-pulse rounded-2xl bg-ink/10" />
          <div className="h-96 animate-pulse rounded-2xl bg-ink/10" />
        </div>
      </div>
    </div>
  );
}
