import Link from "next/link";
import type { Metadata } from "next";
import { ReloadButton } from "@/components/ui/reload-button";

export const metadata: Metadata = {
  title: "Sin conexión",
  description: "Mundo River no pudo conectarse a internet.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span
        className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-ink/10 bg-surface text-river-ink"
        aria-hidden="true"
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 3l18 18M8.5 15.5a5 5 0 0 1 7 0M5 12a10 10 0 0 1 4-2.4M19 12a10 10 0 0 0-3.2-2.1M12 19h.01"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <p className="eyebrow mt-5 text-river-ink">Sin conexión</p>
      <h1 className="mt-2 font-display text-4xl uppercase leading-none sm:text-5xl">
        Se cortó la señal
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-muted">
        No pudimos cargar esta página sin internet. Si ya la visitaste antes, puede estar
        guardada: volvé a intentar o abrí alguna de las secciones disponibles.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <ReloadButton className="btn btn-primary">Reintentar</ReloadButton>
        <Link href="/" className="btn btn-outline">
          Ir al inicio
        </Link>
        <Link href="/novedades" className="btn btn-outline">
          Ver novedades
        </Link>
      </div>

      <p className="mt-6 max-w-md text-xs leading-relaxed text-ink-muted/80">
        Cuando recuperes la conexión, la app se actualiza sola. Los datos en vivo se vuelven a
        consultar en ese momento.
      </p>
    </section>
  );
}
