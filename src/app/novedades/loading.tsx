export default function NewsLoading() {
  return (
    <div className="container-page py-10 md:py-14" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando novedades</span>
      <div className="h-3 w-32 animate-pulse rounded-full bg-ink/10" />
      <div className="mt-4 h-14 w-1/2 animate-pulse rounded-lg bg-ink/10" />
      <div className="mt-7 flex gap-2">
        {[64, 96, 80, 104].map((width) => (
          <div key={width} className="h-11 animate-pulse rounded-full bg-ink/10" style={{ width }} />
        ))}
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-2xl bg-ink/10 sm:col-span-2" />
        <div className="h-72 animate-pulse rounded-2xl bg-ink/10" />
        <div className="h-72 animate-pulse rounded-2xl bg-ink/10" />
        <div className="h-72 animate-pulse rounded-2xl bg-ink/10" />
      </div>
    </div>
  );
}
