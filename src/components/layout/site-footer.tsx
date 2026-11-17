"use client";

import Link from "next/link";
import { ClubCrest } from "@/components/brand/club-crest";
import { useTimeZone } from "@/components/providers/time-zone-provider";
import { NAV_ITEMS } from "@/lib/navigation";

export function SiteFooter() {
  const { timeZone } = useTimeZone();

  return (
    <footer className="mt-20 bg-inverse text-white">
      <div className="h-1.5 red-band" aria-hidden="true" />
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <ClubCrest size="md" />
            <div>
              <p className="font-display text-2xl font-bold uppercase leading-none tracking-wide">
                Mundo <span className="text-river-ink">River</span>
              </p>
              <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.24em] text-white/55">
                Información · Match Center · Temporada
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
            El centro de información del hincha: novedades, calendario, estadísticas y el
            rendimiento individual de cada partido, en tu zona horaria.
          </p>
        </div>

        <nav aria-label="Navegación del pie">
          <p className="eyebrow text-white/50">Secciones</p>
          <ul className="mt-4 space-y-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="font-display text-lg uppercase tracking-wide text-white/85 transition-colors hover:text-river-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="eyebrow text-white/50">Tu experiencia</p>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Fechas y horarios en tu zona horaria local.
          </p>
          <p className="mt-2 inline-flex rounded-full border border-white/15 px-3 py-1.5 font-mono text-xs text-white/75">
            {timeZone}
          </p>
          <p className="mt-6 text-xs leading-relaxed text-white/60">
            Datos deportivos: Bzzoiro Sports Data. Noticias: titulares y enlaces a sus fuentes
            originales. Sitio no oficial, sin relación con River Plate. Escudo de respaldo no oficial.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Mundo River. Hecho por y para el hincha.</p>
          <p>Next.js · TypeScript · Zona horaria local</p>
        </div>
      </div>
    </footer>
  );
}
