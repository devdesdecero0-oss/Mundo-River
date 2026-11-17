"use client";

import { usePwa } from "@/components/providers/pwa-provider";

export function OfflineBanner() {
  const { offline } = usePwa();

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[75] bg-strong pb-[env(safe-area-inset-bottom)] text-on-strong"
    >
      <div className="container-page flex items-center justify-center gap-2 py-2 text-center text-xs font-semibold">
        <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-river" aria-hidden="true" />
        Sin conexión · mostrando datos guardados
      </div>
    </div>
  );
}
