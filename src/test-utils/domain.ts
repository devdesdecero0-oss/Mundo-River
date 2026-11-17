import type {
  Match,
  MatchEvent,
  NewsArticle,
  Player,
  PlayerMatchStats,
  TeamMatchStats,
} from "@/domain/types";

export const RIVER_ID = "river";
export const BOCA_ID = "boca";
export const TZ_AR = "America/Argentina/Buenos_Aires";

export function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: "match-1",
    seasonId: "2026",
    competitionId: "liga-2026",
    round: "Fecha 1",
    kickoffAt: "2026-03-14T23:30:00.000Z", // 20:30 en Buenos Aires
    venue: "Más Monumental",
    homeTeamId: RIVER_ID,
    awayTeamId: BOCA_ID,
    events: [],
    ...overrides,
  };
}

export function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "river:1",
    name: "Franco Armani",
    displayName: "Franco Armani",
    shirtNumber: 1,
    position: "GK",
    nationality: "Argentina",
    ...overrides,
  };
}

export function makeEvent(overrides: Partial<MatchEvent> = {}): MatchEvent {
  return {
    id: "event-1",
    matchId: "match-1",
    minute: 10,
    type: "goal",
    teamId: RIVER_ID,
    playerId: "river:9",
    ...overrides,
  };
}

export function makeStats(overrides: Partial<PlayerMatchStats> = {}): PlayerMatchStats {
  return {
    matchId: "match-1",
    playerId: "river:9",
    minutes: 90,
    rating: 7.5,
    goals: 1,
    assists: 0,
    shots: 3,
    shotsOnTarget: 2,
    cards: { yellow: 0, red: 0 },
    ...overrides,
  };
}

export function makeArticle(overrides: Partial<NewsArticle> = {}): NewsArticle {
  return {
    id: "news-1",
    slug: "noticia-1",
    title: "River ganó el superclásico",
    excerpt: "Un triunfo histórico en el Monumental.",
    body: [{ type: "paragraph", text: "River jugó un gran partido." }],
    category: "plantel-profesional",
    tags: ["superclásico", "monumental"],
    author: "Redacción Mundo River",
    publishedAt: "2026-03-15T12:00:00.000Z",
    coverImage: "/images/news/plantel.svg",
    ...overrides,
  };
}

export function makeTeamStats(overrides: Partial<TeamMatchStats> = {}): TeamMatchStats {
  return {
    possession: 55,
    shots: 14,
    shotsOnTarget: 6,
    corners: 5,
    fouls: 11,
    offsides: 2,
    passes: 480,
    passAccuracy: 84,
    ...overrides,
  };
}
