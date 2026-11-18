import type { Metadata } from "next";
import { RosterPage } from "@/components/roster/roster-page";
import { matchesRepository, squadRepository } from "@/data/repositories";
import { buildSquadPerformance } from "@/domain/stats";
import { SITE_URL } from "@/lib/site.server";

export const metadata: Metadata = {
  title: "Plantel",
  description:
    "Plantel vigente de River Plate y puntaje individual acumulado en los partidos finalizados de la temporada.",
  alternates: { canonical: "/plantel" },
  openGraph: {
    title: "Plantel de River Plate · Mundo River",
    description: "Puntaje individual del plantel de River Plate en la temporada.",
    url: `${SITE_URL}/plantel`,
  },
};

export default async function PlantelPage() {
  const [matches, teams, squad, season, playerStats] = await Promise.all([
    matchesRepository.listMatches(),
    matchesRepository.getTeams(),
    squadRepository.getSquad(),
    matchesRepository.getSeason(),
    matchesRepository.listPlayerStats(),
  ]);
  const performance = buildSquadPerformance(squad.players, matches, playerStats);

  return <RosterPage performance={performance} matches={matches} teams={teams} seasonLabel={season.label} />;
}
