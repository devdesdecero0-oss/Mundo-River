"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ClubCrest } from "@/components/brand/club-crest";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { InstallAppButton } from "@/components/ui/install-app-button";
import { NAV_ITEMS } from "@/lib/navigation";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/92 backdrop-blur-md">
      <div className="h-1 red-band" aria-hidden="true" />
      <div className="container-page flex h-16 items-center justify-between gap-4 md:h-20">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Mundo River — Inicio">
          <ClubCrest size="sm" priority />
          <span className="leading-none">
            <span className="block font-display text-[1.35rem] font-bold uppercase tracking-[0.04em] text-ink">
              Mundo <span className="text-river-ink">River</span>
            </span>
            <span className="mt-0.5 block text-[0.6rem] font-bold uppercase tracking-[0.22em] text-ink-muted">
              La banda, sin filtro
            </span>
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-full px-3.5 py-2 font-display text-[1.02rem] font-semibold uppercase tracking-wide transition-colors ${
                  active ? "text-river-ink" : "text-ink hover:text-river-ink"
                }`}
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-river" aria-hidden="true" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <InstallAppButton />
          <Link href="/calendario" className="btn btn-ink hidden text-sm md:inline-flex">
            Match Center
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="relative block h-4 w-5" aria-hidden="true">
              <span
                className={`absolute left-0 top-0 h-0.5 w-5 rounded bg-ink transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`}
              />
              <span
                className={`absolute left-0 top-[7px] h-0.5 w-5 rounded bg-ink transition-opacity ${open ? "opacity-0" : ""}`}
              />
              <span
                className={`absolute left-0 top-[14px] h-0.5 w-5 rounded bg-ink transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-menu" className="border-t border-ink/10 bg-paper md:hidden">
          <nav aria-label="Navegación móvil" className="container-page flex flex-col py-3">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-12 items-center justify-between rounded-xl px-3 font-display text-lg font-semibold uppercase tracking-wide ${
                    active ? "bg-river-soft text-river-ink" : "text-ink"
                  }`}
                >
                  {item.label}
                  <span aria-hidden="true">→</span>
                </Link>
              );
            })}
            <InstallAppButton variant="menu" />
            <Link href="/calendario" className="btn btn-ink mt-3">
              Ir al Match Center
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
