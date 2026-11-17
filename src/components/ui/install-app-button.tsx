"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePwa } from "@/components/providers/pwa-provider";

function DownloadIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InstallAppButton({ variant = "icon" }: { variant?: "icon" | "menu" }) {
  const { installMode, promptInstall } = usePwa();
  const [helpOpen, setHelpOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (installMode === "installed") setHelpOpen(false);
  }, [installMode]);

  if (installMode === "installed" || installMode === "none") return null;

  const handleClick = () => {
    if (installMode === "ios") {
      setHelpOpen(true);
      return;
    }
    void promptInstall();
  };

  return (
    <>
      {variant === "menu" ? (
        <button
          type="button"
          onClick={handleClick}
          className="flex min-h-12 items-center justify-between rounded-xl px-3 text-left font-display text-lg font-semibold uppercase tracking-wide text-ink"
        >
          Instalar app
          <DownloadIcon />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          aria-label="Instalar app"
          title="Instalar app"
          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-ink/30 hover:bg-ink/5 lg:inline-flex"
        >
          <DownloadIcon />
        </button>
      )}

      {mounted && helpOpen
        ? createPortal(<IosInstallDialog onClose={() => setHelpOpen(false)} />, document.body)
        : null}
    </>
  );
}

function IosInstallDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus();
    };
  }, [close]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-inverse/60 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="instalar-ios-titulo"
        className="w-full max-w-md rounded-2xl border border-ink/10 bg-surface p-6 shadow-lift animate-rise"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-river-ink">Instalar app</p>
            <h2
              id="instalar-ios-titulo"
              className="mt-1 font-display text-2xl uppercase leading-tight"
            >
              Sumala a tu iPhone o iPad
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label="Cerrar instrucciones de instalación"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink-muted hover:bg-paper hover:text-ink"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ×
            </span>
          </button>
        </div>

        <ol className="mt-5 space-y-3 text-sm leading-relaxed text-ink">
          <li className="flex gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-river-soft font-display text-sm font-bold text-river-ink">
              1
            </span>
            Abrí esta página en <strong className="font-semibold">Safari</strong>.
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-river-soft font-display text-sm font-bold text-river-ink">
              2
            </span>
            Tocá el botón <strong className="font-semibold">Compartir</strong> (el cuadrado con la
            flecha hacia arriba).
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-river-soft font-display text-sm font-bold text-river-ink">
              3
            </span>
            Elegí <strong className="font-semibold">“Añadir a pantalla de inicio”</strong>.
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-river-soft font-display text-sm font-bold text-river-ink">
              4
            </span>
            Confirmá con <strong className="font-semibold">“Añadir”</strong>.
          </li>
        </ol>

        <p className="mt-5 text-xs leading-relaxed text-ink-muted">
          Se va a abrir como una app, sin la barra del navegador. También podés seguir usando
          Mundo River desde Safari cuando quieras.
        </p>

        <button type="button" onClick={close} className="btn btn-primary mt-6 w-full">
          Entendido
        </button>
      </div>
    </div>
  );
}
