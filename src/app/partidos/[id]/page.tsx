import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MatchCenter } from "@/components/match/match-center";
import { matchesRepository, squadRepository } from "@/data/repositories";
import { computeHeadToHead, sortMatches } from "@/domain/matches";
import { deriveMatchStatus } from "@/domain/matches/status";
import { formatLocalDateTimeLong } from "@/domain/time";
import type { Match } from "@/domain/types";
import { FALLBACK_TIME_ZONE } from "@/lib/time-zone";
import { SITE_NAME } from "@/lib/navigation";
import { SITE_URL } from "@/lib/site.server";

interface MatchPageProps {
  params: Promise<{ id: string }>;
}

const EVENT_STATUS: Record<string, string> = {
  scheduled: "https://schema.org/EventScheduled",
  live: "https://schema.org/EventScheduled",
  halftime: "https://schema.org/EventScheduled",
  finished: "https://schema.org/EventScheduled",
  postponed: "https://schema.org/EventPostponed",
  suspended: "https://schema.org/EventCancelled",
  cancelled: "https://schema.org/EventCancelled",
};

function teamFallback(id: string) {
  return {
    id,
    name: id,
    shortName: id.slice(0, 3).toUpperCase(),
    crest: "",
    primaryColor: "#0a0a0c",
    secondaryColor: "#e4032e",
  };
}

function previousMeetingsOf(
  matches: readonly Match[],
  current: Match,
  now: Date,
): Match[] {
  const pair = new Set([current.homeTeamId, current.awayTeamId]);
  return sortMatches(matches, "desc")
    .filter((match) => match.id !== current.id)
    .filter(
      (match) =>
        pair.has(match.homeTeamId) &&
        pair.has(match.awayTeamId) &&
        deriveMatchStatus(match, now) === "finished" &&
        match.score !== undefined,
    )
    .slice(0, 5);
}

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
  const { id } = await params;
  const match = await matchesRepository.getMatch(id);
  if (!match) {
    return {
      title: "Partido no encontrado",
      robots: { index: false, follow: false },
    };
  }

  const [teams, competitions] = await Promise.all([
    matchesRepository.getTeams(),
    matchesRepository.getCompetitions(),
  ]);
  const home = teams.find((team) => team.id === match.homeTeamId);
  const away = teams.find((team) => team.id === match.awayTeamId);
  const competition = competitions.find((item) => item.id === match.competitionId);
  const matchup = `${home?.name ?? match.homeTeamId} vs ${away?.name ?? match.awayTeamId}`;
  const dateLabel = formatLocalDateTimeLong(match.kickoffAt, FALLBACK_TIME_ZONE);

  return {
    title: `${matchup} · ${match.round}`,
    description: `${matchup} por ${competition?.name ?? "la temporada"}: ${match.round}, ${dateLabel}, ${match.venue}. Resultado, incidencias, estadísticas, formaciones y calificaciones.`,
    alternates: { canonical: `/partidos/${match.id}` },
    openGraph: {
      type: "article",
      title: `${matchup} · ${match.round}`,
      description: `Previa, resultado y ficha técnica del partido en ${match.venue}.`,
      images: [{ url: "/images/news/plantel.svg", width: 1200, height: 675, alt: matchup }],
    },
  };
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { id } = await params;
  const match = await matchesRepository.getMatch(id);
  if (!match) notFound();

  const now = new Date();
  const [matches, teams, competitions, squad, playerStats] = await Promise.all([
    matchesRepository.listMatches(),
    matchesRepository.getTeams(),
    matchesRepository.getCompetitions(),
    squadRepository.getSquad(),
    matchesRepository.getMatchPlayerStats(match.id),
  ]);

  const homeTeam =
    teams.find((team) => team.id === match.homeTeamId) ?? teamFallback(match.homeTeamId);
  const awayTeam =
    teams.find((team) => team.id === match.awayTeamId) ?? teamFallback(match.awayTeamId);
  const competition = competitions.find((item) => item.id === match.competitionId) ?? null;

  const riverIsHome = match.homeTeamId === "river";
  const opponentId = riverIsHome ? match.awayTeamId : match.homeTeamId;
  const h2h = computeHeadToHead(matches, "river", opponentId, now);
  const previousMeetings = previousMeetingsOf(matches, match, now);
  const status = deriveMatchStatus(match, now);

  const eventStatus = EVENT_STATUS[status] ?? EVENT_STATUS.scheduled;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SportsEvent",
        name: `${homeTeam.name} vs ${awayTeam.name} · ${competition?.name ?? "River Plate"}`,
        description: `${match.round} en ${match.venue}. Ficha completa del partido en ${SITE_NAME}.`,
        startDate: match.kickoffAt,
        eventStatus,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        sport: "Fútbol",
        location: {
          "@type": "Place",
          name: match.venue,
          address: { "@type": "PostalAddress", addressCountry: "AR" },
        },
        homeTeam: { "@type": "SportsTeam", name: homeTeam.name },
        awayTeam: { "@type": "SportsTeam", name: awayTeam.name },
        competitor: [
          { "@type": "SportsTeam", name: homeTeam.name },
          { "@type": "SportsTeam", name: awayTeam.name },
        ],
        organizer: { "@type": "SportsOrganization", name: competition?.name ?? "AFA" },
        url: `${SITE_URL}/partidos/${match.id}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Calendario",
            item: `${SITE_URL}/calendario`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `${homeTeam.shortName} vs ${awayTeam.shortName}`,
            item: `${SITE_URL}/partidos/${match.id}`,
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
      <Suspense
        fallback={
          <div className="container-page py-10" aria-label="Cargando Match Center">
            <div className="h-56 animate-pulse rounded-2xl bg-ink/10" />
            <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="h-80 animate-pulse rounded-2xl bg-ink/10" />
              <div className="h-80 animate-pulse rounded-2xl bg-ink/10" />
            </div>
          </div>
        }
      >
        <MatchCenter
          match={match}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          competition={competition}
          playerStats={playerStats}
          players={squad.players}
          h2h={h2h}
          previousMeetings={previousMeetings}
          nowIso={now.toISOString()}
        />
      </Suspense>
    </>
  );
}
