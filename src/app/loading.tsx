export default function Loading() {
  return (
    <div className="container-page py-10 md:py-14" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando contenido</span>
      <div className="h-4 w-28 animate-pulse rounded-full bg-ink/10" />
      <div className="mt-4 h-12 w-2/3 animate-pulse rounded-lg bg-ink/10 sm:h-16" />
      <div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-ink/10" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-2xl bg-ink/10" />
        <div className="h-64 animate-pulse rounded-2xl bg-ink/10" />
        <div className="h-64 animate-pulse rounded-2xl bg-ink/10" />
      </div>
    </div>
  );
}
