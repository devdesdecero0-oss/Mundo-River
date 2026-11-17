import type {
  Competition,
  CompetitionType,
  H2HSummary,
  Lineup,
  LineupPlayer,
  Match,
  MatchEvent,
  MatchEventType,
  MatchPeriod,
  MatchScore,
  MatchStatus,
  PlayerMatchStats,
  Season,
  SquadSnapshot,
  Team,
  TeamMatchStats,
} from "@/domain/types";
import { normalizeRating } from "@/domain/stats";
import { normalizeSquadPayload } from "@/domain/squad";
import type {
  BzzoiroEvent,
  BzzoiroEventDetail,
  BzzoiroIncident,
  BzzoiroLeague,
  BzzoiroLineups,
  BzzoiroPlayerStat,
  BzzoiroSquad,
} from "./schemas";

export const BZZOIRO_PROVIDER = "bzzoiro";
export const RIVER_PROVIDER_TEAM_ID = 755;
export const RIVER_TEAM_ID = "river";

/** Metadatos de las competiciones argentinas que publica Bzzoiro. */
export const LEAGUE_META: Record<
  number,
  { slug: string; shortName: string; type: CompetitionType }
> = {
  85: { slug: "liga-profesional", shortName: "Liga Profesional", type: "league" },
  33: { slug: "copa-sudamericana", shortName: "Sudamericana", type: "international" },
  79: { slug: "amistosos", shortName: "Amistosos", type: "friendly" },
};

const STATUS_MAP: Record<string, MatchStatus> = {
  notstarted: "scheduled",
  scheduled: "scheduled",
  inprogress: "live",
  live: "live",
  finished: "finished",
  postponed: "postponed",
  cancelled: "cancelled",
  canceled: "cancelled",
  suspended: "suspended",
  abandoned: "suspended",
};

const PERIOD_MAP: Record<string, MatchPeriod> = {
  "1H": "1H",
  "2H": "2H",
  HT: "HT",
  ET: "ET",
  PEN: "PEN",
};

const LINEUP_POSITION: Record<string, string> = {
  G: "GK",
  GK: "GK",
  D: "DF",
  DF: "DF",
  M: "MF",
  MF: "MF",
  F: "FW",
  FW: "FW",
};

/** Canchas con nombre público verificado; el proveedor a veces trae el texto dañado. */
const VENUE_NAMES: Record<number, string> = {
  445: "Estadio Más Monumental",
};

export function providerTeamId(teamId: number): string {
  return teamId === RIVER_PROVIDER_TEAM_ID ? RIVER_TEAM_ID : `${BZZOIRO_PROVIDER}:team:${teamId}`;
}

export function providerPlayerId(playerId: number | null | undefined): string {
  return `${BZZOIRO_PROVIDER}:${playerId ?? 0}`;
}

export function providerMatchId(eventId: number): string {
  return `${BZZOIRO_PROVIDER}:event:${eventId}`;
}

export function providerCompetitionId(leagueId: number, seasonId: number): string {
  return `${BZZOIRO_PROVIDER}:${leagueId}-${seasonId}`;
}

export function mapProviderStatus(event: BzzoiroEvent): MatchStatus {
  const status = STATUS_MAP[event.status.trim().toLowerCase()] ?? "scheduled";
  if (status === "live" && (event.period ?? "").trim().toUpperCase() === "HT") {
    return "halftime";
  }
  return status;
}

export function mapProviderPeriod(period: string | null | undefined): MatchPeriod | undefined {
  const key = (period ?? "").trim().toUpperCase();
  return PERIOD_MAP[key];
}

export function mapScore(event: BzzoiroEvent): MatchScore | undefined {
  const home = event.home_score;
  const away = event.away_score;
  if (typeof home !== "number" || typeof away !== "number") return undefined;

  const halftimeHome = event.home_score_ht;
  const halftimeAway = event.away_score_ht;
  const penalties = readShootout(event.penalty_shootout);

  return {
    home,
    away,
    ...(typeof halftimeHome === "number" && typeof halftimeAway === "number"
      ? { halftime: { home: halftimeHome, away: halftimeAway } }
      : {}),
    ...(penalties ? { penalties } : {}),
  };
}

export function mapRound(event: BzzoiroEvent): string {
  const candidates = [event.round_label, event.stage_name, event.round_name];
  for (const candidate of candidates) {
    const value = (candidate ?? "").trim();
    if (value) return value;
  }
  if (typeof event.round_number === "number" && event.round_number > 0) {
    return `Fecha ${event.round_number}`;
  }
  return "Partido";
}

export interface MapMatchOptions {
  venueName?: string;
  seasonId?: string;
  competitionId?: string;
}

/** Convierte un evento del proveedor en un partido del dominio. */
export function mapMatch(event: BzzoiroEvent, options: MapMatchOptions = {}): Match {
  const kickoff = new Date(event.event_date);
  if (Number.isNaN(kickoff.getTime())) {
    throw new RangeError(`Fecha de partido inválida: ${event.event_date}`);
  }

  const seasonId = options.seasonId ?? String(kickoff.getUTCFullYear());
  const competitionId =
    options.competitionId ?? providerCompetitionId(event.league_id, event.season_id);
  const status = mapProviderStatus(event);
  const minute =
    (status === "live" || status === "halftime") && typeof event.current_minute === "number"
      ? Math.max(0, Math.floor(event.current_minute))
      : undefined;
  const score = mapScore(event);
  const period = mapProviderPeriod(event.period);

  return {
    id: providerMatchId(event.id),
    seasonId,
    competitionId,
    round: mapRound(event),
    kickoffAt: kickoff.toISOString(),
    venue: options.venueName ?? (event.venue_id ? VENUE_NAMES[event.venue_id] : undefined) ?? "Estadio a confirmar",
    homeTeamId: providerTeamId(event.home_team_id),
    awayTeamId: providerTeamId(event.away_team_id),
    providerStatus: status,
    ...(minute !== undefined ? { providerMinute: minute } : {}),
    ...(period ? { period } : {}),
    ...(score ? { score } : {}),
    ...(typeof event.attendance === "number" ? { attendance: event.attendance } : {}),
    events: [],
  };
}

export function mapCompetition(league: BzzoiroLeague, seasonId: number): Competition {
  const meta = LEAGUE_META[league.id];
  const season = league.current_season ?? null;
  return {
    id: providerCompetitionId(league.id, season?.id ?? seasonId),
    slug: meta?.slug ?? `liga-${league.id}`,
    name: league.name,
    shortName: meta?.shortName ?? league.name,
    type: meta?.type ?? "league",
    seasonLabel: String(season?.year ?? season?.name ?? ""),
  };
}

export function buildSeason(year: number, competitionIds: string[]): Season {
  return {
    id: String(year),
    label: `Temporada ${year}`,
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    isActive: true,
    competitionIds,
  };
}

export function shortNameFrom(teamName: string): string {
  const stopWords = new Set([
    "ca",
    "club",
    "atletico",
    "atl",
    "fc",
    "de",
    "del",
    "y",
    "the",
  ]);
  const words = normalizeText(teamName)
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !stopWords.has(word));

  const source = words.length > 0 ? words : normalizeText(teamName).split(/\s+/).filter(Boolean);
  const acronym = source.map((word) => word[0] ?? "").join("").toUpperCase();
  if (acronym.length >= 3) return acronym.slice(0, 3);
  return (source[0] ?? teamName).slice(0, 3).toUpperCase();
}

/** Equipos derivados del listado de partidos, sin inventar colores ni escudos. */
export function mapTeams(events: readonly BzzoiroEvent[]): Team[] {
  const seen = new Map<string, Team>();

  for (const event of events) {
    addTeam(seen, event.home_team_id, event.home_team);
    addTeam(seen, event.away_team_id, event.away_team);
  }

  return [...seen.values()].sort((a, b) => {
    if (a.id === RIVER_TEAM_ID) return -1;
    if (b.id === RIVER_TEAM_ID) return 1;
    return a.name.localeCompare(b.name, "es-AR");
  });
}

function addTeam(seen: Map<string, Team>, providerId: number, name: string): void {
  const id = providerTeamId(providerId);
  if (seen.has(id)) return;

  if (id === RIVER_TEAM_ID) {
    seen.set(id, {
      id,
      name: "River Plate",
      shortName: "RIV",
      crest: "/brand/river-crest.svg",
      primaryColor: "#E4032E",
      secondaryColor: "#0B0B0F",
    });
    return;
  }

  seen.set(id, {
    id,
    name,
    shortName: shortNameFrom(name),
    crest: "",
    primaryColor: "#0A0A0A",
    secondaryColor: "#6B7280",
  });
}

export function mapTeamStats(
  raw: {
    ball_possession?: number | null;
    total_shots?: number | null;
    shots_on_target?: number | null;
    corner_kicks?: number | null;
    fouls?: number | null;
    offsides?: number | null;
    passes?: number | null;
    pass_accuracy_pct?: number | null;
  } | null
  | undefined,
): TeamMatchStats {
  return {
    possession: numberOrZero(raw?.ball_possession),
    shots: numberOrZero(raw?.total_shots),
    shotsOnTarget: numberOrZero(raw?.shots_on_target),
    corners: numberOrZero(raw?.corner_kicks),
    fouls: numberOrZero(raw?.fouls),
    offsides: numberOrZero(raw?.offsides),
    passes: numberOrZero(raw?.passes),
    passAccuracy: numberOrZero(raw?.pass_accuracy_pct),
  };
}

export interface MapMatchEventOptions {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
}

/** Convierte las incidencias del proveedor en eventos del dominio. */
export function mapIncidents(
  incidents: readonly BzzoiroIncident[],
  options: MapMatchEventOptions,
): MatchEvent[] {
  const events: MatchEvent[] = [];

  incidents.forEach((incident, index) => {
    const type = mapIncidentType(incident);
    if (!type) return;

    const teamId = incident.is_home ? options.homeTeamId : options.awayTeamId;
    const minute = Math.max(0, Math.floor(numberOrZero(incident.minute)));
    const extraMinute =
      typeof incident.added_time === "number" && incident.added_time > 0
        ? incident.added_time
        : undefined;

    const base = {
      id: `${options.matchId}:${index}:${type}`,
      matchId: options.matchId,
      minute,
      ...(extraMinute !== undefined ? { extraMinute } : {}),
      type,
      teamId,
    };

    if (type === "substitution") {
      events.push({
        ...base,
        playerId: playerIdOf(incident.player_out_id, incident.player_out),
        relatedPlayerId: playerIdOf(incident.player_in_id, incident.player_in),
        ...(incident.player_out ? { playerName: incident.player_out } : {}),
        ...(incident.player_in ? { relatedPlayerName: incident.player_in } : {}),
      });
      return;
    }

    const detail =
      type === "var"
        ? incident.decision ?? undefined
        : type === "yellow" || type === "red" || type === "second_yellow"
          ? incident.reason ?? undefined
          : type === "penalty_goal" || type === "penalty_missed"
            ? "Penal"
            : undefined;

    events.push({
      ...base,
      playerId: playerIdOf(incident.player_id, incident.player),
      ...(incident.player ? { playerName: incident.player } : {}),
      ...(incident.assist
        ? { relatedPlayerName: incident.assist, relatedPlayerId: playerIdOf(null, incident.assist) }
        : {}),
      ...(detail ? { detail } : {}),
    });
  });

  return events;
}

function mapIncidentType(incident: BzzoiroIncident): MatchEventType | null {
  switch (incident.type) {
    case "goal": {
      const goalType = (incident.goal_type ?? "").trim().toLowerCase();
      if (goalType.includes("own")) return "own_goal";
      if (goalType.includes("penalty")) return "penalty_goal";
      return "goal";
    }
    case "penalty_missed":
      return "penalty_missed";
    case "card": {
      const cardType = (incident.card_type ?? "").trim().toLowerCase();
      if (cardType.includes("second") || cardType.includes("yellowred")) return "second_yellow";
      if (cardType.includes("red")) return "red";
      return "yellow";
    }
    case "substitution":
      return "substitution";
    case "varDecision":
      return "var";
    default:
      return null;
  }
}

export function mapLineups(
  payload: BzzoiroLineups,
  matchId: string,
): Lineup[] {
  if (!payload.lineups) return [];

  const result: Lineup[] = [];
  for (const side of [payload.lineups.home, payload.lineups.away]) {
    if (!side) continue;

    const starters: LineupPlayer[] = side.players.map((player) => ({
      playerId: providerPlayerId(player.id),
      name: player.name,
      position: LINEUP_POSITION[(player.position ?? "").toUpperCase()] ?? "MF",
      shirtNumber: numberOrZero(player.jersey_number),
    }));

    const benchPlayers: LineupPlayer[] = (side.substitutes ?? []).map((player) => ({
      playerId: providerPlayerId(player.id),
      name: player.name,
      position: LINEUP_POSITION[(player.position ?? "").toUpperCase()] ?? "MF",
      shirtNumber: numberOrZero(player.jersey_number),
    }));

    result.push({
      matchId,
      teamId: providerTeamId(side.team_id),
      formation: (side.formation ?? "").trim() || "Sin formación",
      coach: "",
      starters,
      bench: benchPlayers.map((player) => player.playerId),
      benchPlayers,
    });
  }

  return result;
}

export function mapPlayerStats(
  stats: readonly BzzoiroPlayerStat[],
  matchId: string,
): PlayerMatchStats[] {
  return stats
    .filter((row) => numberOrZero(row.minutes_played) > 0)
    .map((row) => ({
      matchId,
      playerId: providerPlayerId(row.player_id),
      minutes: Math.floor(numberOrZero(row.minutes_played)),
      rating: normalizeRating(row.rating),
      goals: numberOrZero(row.goals),
      assists: numberOrZero(row.goal_assist),
      shots: numberOrZero(row.total_shots),
      shotsOnTarget: numberOrZero(row.shots_on_target),
      cards: {
        yellow: numberOrZero(row.yellow_card),
        red: numberOrZero(row.red_card),
      },
    }));
}

export function mapStats(
  payload: {
    stats: {
      home?: Parameters<typeof mapTeamStats>[0];
      away?: Parameters<typeof mapTeamStats>[0];
    };
  },
  ): Match["stats"] {
  if (!payload.stats.home && !payload.stats.away) return undefined;
  return {
    home: mapTeamStats(payload.stats.home),
    away: mapTeamStats(payload.stats.away),
  };
}

export interface MapSquadOptions {
  seasonId: string;
  fetchedAt: string;
}

export function mapSquad(payload: BzzoiroSquad, options: MapSquadOptions): SquadSnapshot {
  return normalizeSquadPayload(
    {
      provider: BZZOIRO_PROVIDER,
      fetchedAt: options.fetchedAt,
      players: payload.players.map((player) => ({
        id: player.id,
        name: player.name,
        displayName: player.short_name ?? undefined,
        shirtNumber: player.jersey_number ?? 0,
        position: player.position ?? "",
        nationality: player.nationality ?? undefined,
        availability: player.availability ?? undefined,
        injuryType: player.injury_type ?? undefined,
        injuryExpectedReturn: player.injury_expected_return ?? undefined,
      })),
    },
    BZZOIRO_PROVIDER,
    {
      teamId: RIVER_TEAM_ID,
      seasonId: options.seasonId,
      from: `${options.seasonId}-01-01`,
    },
  );
}

/** El proveedor expone H2H, pero el dominio lo recalcula desde los partidos. */
export function mapH2H(
  raw: {
    total_matches?: number;
    home_wins?: number;
    draws?: number;
    away_wins?: number;
    home_goals?: number;
    away_goals?: number;
  } | null
  | undefined,
  perspective: "home" | "away",
): H2HSummary | null {
  if (!raw || typeof raw.total_matches !== "number") return null;
  const wins = perspective === "home" ? raw.home_wins : raw.away_wins;
  const losses = perspective === "home" ? raw.away_wins : raw.home_wins;
  const goalsFor = perspective === "home" ? raw.home_goals : raw.away_goals;
  const goalsAgainst = perspective === "home" ? raw.away_goals : raw.home_goals;

  return {
    played: raw.total_matches,
    wins: numberOrZero(wins),
    draws: numberOrZero(raw.draws),
    losses: numberOrZero(losses),
    goalsFor: numberOrZero(goalsFor),
    goalsAgainst: numberOrZero(goalsAgainst),
  };
}

export function mapVenueName(venue: { id: number; name: string } | null | undefined): string | undefined {
  if (!venue) return undefined;
  return VENUE_NAMES[venue.id] ?? venue.name;
}

function playerIdOf(id: number | null | undefined, name: string | null | undefined): string {
  if (typeof id === "number") return providerPlayerId(id);
  const slug = normalizeText(name ?? "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug ? `unknown:${slug}` : "unknown:player";
}

function readShootout(value: unknown): { home: number; away: number } | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const home = record.home ?? record.home_score;
  const away = record.away ?? record.away_score;
  if (typeof home === "number" && typeof away === "number") return { home, away };
  return null;
}

function numberOrZero(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export type { BzzoiroEventDetail };
