import type { Metadata } from "next";
import { SeasonDashboard } from "@/components/season/season-dashboard";
import { matchesRepository, squadRepository } from "@/data/repositories";
import { SITE_URL } from "@/lib/site.server";

export const metadata: Metadata = {
  title: "Temporada",
  description:
    "Máximos goleadores y asistentes, registro del equipo, racha y rendimiento como local y visitante de River Plate en la temporada activa. Filtrá por competición.",
  alternates: { canonical: "/temporada" },
  openGraph: {
    title: "Temporada de River Plate · Mundo River",
    description:
      "Goleadores, asistentes, efectividad y últimos resultados de River, con filtros por competición.",
    images: [{ url: "/images/news/plantel.svg", width: 1200, height: 675, alt: "Temporada de River Plate" }],
  },
};

export default async function TemporadaPage() {
  const [matches, competitions, squad, season, playerStats] = await Promise.all([
    matchesRepository.listMatches(),
    matchesRepository.getCompetitions(),
    squadRepository.getSquad(),
    matchesRepository.getSeason(),
    matchesRepository.listPlayerStats(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `Temporada de River Plate · ${season.label}`,
        description:
          "Rankings de goleadores y asistentes, registro del equipo y rendimiento de River Plate.",
        inLanguage: "es-AR",
        url: `${SITE_URL}/temporada`,
        about: { "@type": "SportsTeam", name: "River Plate" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Temporada",
            item: `${SITE_URL}/temporada`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeasonDashboard
        matches={matches}
        competitions={competitions}
        players={squad.players}
        playerStats={playerStats}
        seasonLabel={season.label}
      />
    </>
  );
}
