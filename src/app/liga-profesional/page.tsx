import type { Metadata } from "next";
import { LigaProfesionalPage } from "@/components/league/liga-profesional-page";
import { standingsRepository } from "@/data/repositories";
import { SITE_URL } from "@/lib/site.server";

export const metadata: Metadata = {
  title: "Liga Profesional",
  description:
    "Tabla anual y grupo de River en la Liga Profesional de Fútbol, con posiciones y puntos actualizados.",
  alternates: { canonical: "/liga-profesional" },
  openGraph: {
    title: "Liga Profesional · Mundo River",
    description: "Tabla anual y grupo de River en la Liga Profesional.",
    url: `${SITE_URL}/liga-profesional`,
  },
};

export default async function LigaProfesionalRoute() {
  const standings = await standingsRepository.getLigaProfesional();

  return <LigaProfesionalPage standings={standings} />;
}
