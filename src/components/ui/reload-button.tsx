"use client";

import type { ReactNode } from "react";

/** Recarga la página actual; útil en la pantalla sin conexión. */
export function ReloadButton({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <button type="button" className={className} onClick={() => window.location.reload()}>
      {children}
    </button>
  );
}
