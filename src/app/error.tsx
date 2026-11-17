"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En producción el mensaje puede estar oculto; el digest identifica el incidente.
    console.error("[Mundo River] Error de render:", error.digest ?? error.message);
  }, [error]);

  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="eyebrow text-river-ink">Algo salió mal</p>
      <h1 className="mt-3 font-display text-4xl uppercase leading-none sm:text-5xl">
        No pudimos cargar esta sección
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-muted">
        Los datos no están disponibles en este momento. Podés reintentar la carga o volver al
        inicio mientras lo resolvemos.
      </p>
      {error.digest ? (
        <p className="mt-3 rounded-full bg-paper-deep px-3 py-1 font-mono text-[0.68rem] text-ink-muted">
          ID de error: {error.digest}
        </p>
      ) : null}
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={reset} className="btn btn-primary">
          Reintentar
        </button>
        <Link href="/" className="btn btn-outline">
          Ir al inicio
        </Link>
        <Link href="/calendario" className="btn btn-outline">
          Ver calendario
        </Link>
      </div>
    </section>
  );
}
