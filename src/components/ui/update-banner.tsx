"use client";

import { usePwa } from "@/components/providers/pwa-provider";

export function UpdateBanner() {
  const { updateAvailable, applyUpdate, dismissUpdate } = usePwa();

  if (!updateAvailable) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-[80] px-4">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto mx-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-ink/10 bg-surface p-3 shadow-lift"
      >
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-river-soft text-river-ink"
          aria-hidden="true"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 12a8 8 0 1 1-2.34-5.66M20 4v6h-6"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold uppercase leading-tight">
            Hay una versión nueva
          </p>
          <p className="mt-0.5 text-xs leading-snug text-ink-muted">
            Actualizá cuando quieras: no se cierra nada de lo que estés viendo.
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <button type="button" onClick={applyUpdate} className="btn btn-primary min-h-9 px-3 text-sm">
            Actualizar
          </button>
          <button
            type="button"
            onClick={dismissUpdate}
            className="min-h-8 rounded-full px-2 text-[0.68rem] font-bold uppercase tracking-wide text-ink-muted hover:text-ink"
          >
            Después
          </button>
        </div>
      </div>
    </div>
  );
}
