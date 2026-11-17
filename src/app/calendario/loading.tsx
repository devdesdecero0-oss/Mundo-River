export default function CalendarLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando el calendario</span>
      <div className="bg-inverse pb-20 pt-10 text-white md:pb-24 md:pt-14">
        <div className="container-page">
          <div className="h-3 w-44 animate-pulse rounded-full bg-white/15" />
          <div className="mt-4 h-14 w-2/3 animate-pulse rounded-lg bg-white/15" />
          <div className="mt-4 h-4 w-1/2 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>
      <div className="container-page pb-12">
        <div className="card -mt-8 h-[520px] animate-pulse" />
      </div>
    </div>
  );
}
