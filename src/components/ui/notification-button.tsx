"use client";

import { useState } from "react";
import { useNotifications } from "@/components/providers/notification-provider";

export function NotificationButton({ variant = "header" }: { variant?: "header" | "menu" }) {
  const { status, subscribe, unsubscribe } = useNotifications();
  const [busy, setBusy] = useState(false);

  if (status === "unsupported" || status === "denied") return null;
  if (status === "ios") {
    return (
      <span
        className={
          variant === "menu"
            ? "px-3 py-3 text-sm font-semibold text-ink-muted"
            : "hidden text-[0.65rem] font-bold uppercase tracking-wide text-ink-muted md:inline"
        }
      >
        Instalá la app para activar avisos
      </span>
    );
  }

  async function toggle() {
    setBusy(true);
    try {
      if (status === "subscribed") await unsubscribe();
      else await subscribe();
    } finally {
      setBusy(false);
    }
  }

  const label =
    status === "subscribed" ? "Desactivar notificaciones" : "Activar notificaciones";
  const className =
    variant === "menu"
      ? "flex min-h-12 w-full items-center justify-between rounded-xl px-3 text-left font-display text-lg font-semibold uppercase tracking-wide text-ink"
      : "inline-flex h-10 items-center gap-2 rounded-full border border-ink/15 px-3 text-xs font-bold uppercase tracking-wide text-ink-muted hover:border-river hover:text-river-ink";

  return (
    <button type="button" className={className} onClick={() => void toggle()} disabled={busy} aria-label={label}>
      <span aria-hidden="true">♧</span>
      <span>{busy ? "Procesando…" : status === "subscribed" ? "Notificaciones activas" : "Activar avisos"}</span>
      {variant === "menu" ? <span aria-hidden="true">→</span> : null}
    </button>
  );
}
