/**
 * Contratos de dominio de Mundo River.
 *
 * Este módulo no depende de React, Next.js, red ni almacenamiento.
 * Es la única fuente de verdad para los tipos que consumen la UI,
 * los fixtures y los repositorios.
 */

export type DateKey = `${number}-${number}-${number}`;
export type MonthKey = `${number}-${number}`;

export type CompetitionType = "league" | "cup" | "international" | "friendly";

export interface Competition {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  type: CompetitionType;
  seasonLabel: string;
}

export interface Season {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  competitionIds: string[];
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  crest: string;
  primaryColor: string;
  secondaryColor: string;
}

export type PlayerPosition = "GK" | "DF" | "MF" | "FW";

export type PlayerAvailability = "available" | "injured" | "suspended" | "unknown";

export interface PlayerInjury {
  type: string;
  expectedReturn?: string;
}

export interface ProviderRef {
  provider: string;
  externalId: string;
  updatedAt: string;
}

export interface Player {
  id: string;
  name: string;
  displayName: string;
  shirtNumber: number;
  position: PlayerPosition;
  nationality: string;
  photo?: string;
  isCaptain?: boolean;
  providerRef?: ProviderRef;
  contractUntil?: string;
  availability?: PlayerAvailability;
  injury?: PlayerInjury;
}

export interface SquadMembership {
  playerId: string;
  teamId: string;
  seasonId: string;
  shirtNumber: number;
  position: PlayerPosition;
  role: "starter" | "rotation" | "youth";
  from: string;
  to?: string;
}

export interface SquadWarning {
  code:
    | "MISSING_FIELD"
    | "DUPLICATE_NUMBER"
    | "DUPLICATE_PLAYER"
    | "UNKNOWN_POSITION"
    | "EMPTY_PAYLOAD"
    | "INVALID_SHIRT_NUMBER";
  externalId?: string;
  message: string;
}

export interface SquadSnapshot {
  provider: string;
  fetchedAt: string;
  checksum: string;
  players: Player[];
  memberships: SquadMembership[];
  warnings: SquadWarning[];
}

export interface RawPlayer {
  id?: string | number;
  name?: string;
  displayName?: string;
  shirtNumber?: number | string;
  position?: string;
  nationality?: string;
  photo?: string;
  isCaptain?: boolean;
  contractUntil?: string;
  updatedAt?: string;
  availability?: string;
  injuryType?: string;
  injuryExpectedReturn?: string;
}

export interface RawSquadPayload {
  provider?: string;
  fetchedAt?: string;
  players?: RawPlayer[];
}

export interface SquadValidationResult {
  valid: boolean;
  playerCount: number;
  errors: SquadWarning[];
  warnings: SquadWarning[];
}

export type MatchStatus =
  | "scheduled"
  | "live"
  | "halftime"
  | "finished"
  | "postponed"
  | "suspended"
  | "cancelled";

export type MatchPeriod = "1H" | "HT" | "2H" | "ET" | "PEN";

export interface MatchScore {
  home: number;
  away: number;
  halftime?: { home: number; away: number };
  penalties?: { home: number; away: number };
}

export type MatchEventType =
  | "goal"
  | "own_goal"
  | "penalty_goal"
  | "penalty_missed"
  | "yellow"
  | "red"
  | "second_yellow"
  | "substitution"
  | "var";

export interface MatchEvent {
  id: string;
  matchId: string;
  minute: number;
  extraMinute?: number;
  type: MatchEventType;
  teamId: string;
  playerId: string;
  relatedPlayerId?: string;
  detail?: string;
  /** Nombre provisto por la fuente cuando el jugador no está en el plantel local. */
  playerName?: string;
  relatedPlayerName?: string;
}

export interface PlayerMatchStats {
  matchId: string;
  playerId: string;
  minutes: number;
  rating: number | null;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  cards: { yellow: number; red: number };
}

export interface LineupPlayer {
  playerId: string;
  name?: string;
  position: string;
  shirtNumber: number;
}

export interface Lineup {
  matchId: string;
  teamId: string;
  formation: string;
  coach: string;
  starters: LineupPlayer[];
  bench: string[];
  /** Detalle de suplentes con nombre y dorsal cuando la fuente lo provee. */
  benchPlayers?: LineupPlayer[];
}

export interface TeamMatchStats {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
  offsides: number;
  passes: number;
  passAccuracy: number;
}

export interface Match {
  id: string;
  seasonId: string;
  competitionId: string;
  round: string;
  kickoffAt: string;
  venue: string;
  referee?: string;
  broadcasters?: string[];
  homeTeamId: string;
  awayTeamId: string;
  /** Estado informado por el proveedor. Tiene prioridad sobre la derivación por reloj. */
  providerStatus?: MatchStatus;
  /** Minuto informado por el proveedor para partidos en vivo. */
  providerMinute?: number;
  statusOverride?: "postponed" | "suspended" | "cancelled" | "finished";
  statusReason?: string;
  period?: MatchPeriod;
  score?: MatchScore;
  finishedAt?: string;
  liveWindowMinutes?: number;
  attendance?: number;
  stoppageFirstHalf?: number;
  stoppageSecondHalf?: number;
  stats?: { home: TeamMatchStats; away: TeamMatchStats };
  lineups?: Lineup[];
  events: MatchEvent[];
}

export type NewsCategory =
  | "plantel-profesional"
  | "inferiores"
  | "institucional"
  | "mercado-de-pases";

export type NewsBlockType = "paragraph" | "heading" | "image" | "quote";

export interface NewsBlock {
  type: NewsBlockType;
  text?: string;
  src?: string;
  alt?: string;
  caption?: string;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: NewsBlock[];
  category: NewsCategory;
  tags: string[];
  author: string;
  publishedAt: string;
  updatedAt?: string;
  coverImage: string;
  featured?: boolean;
  relatedIds?: string[];
  /** Enlace a la nota original cuando el artículo es un agregador RSS. */
  externalUrl?: string;
  /** Medio de origen para la atribución. */
  sourceName?: string;
}

export interface SeasonRecord {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  effectiveness: number;
  winRate: number;
}

export type FormResult = "W" | "D" | "L";

export interface RankingEntry {
  playerId: string;
  player: Player;
  value: number;
  goals: number;
  assists: number;
  minutes: number;
  isTied: boolean;
}

export interface H2HSummary {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface PlayerSeasonTotals {
  playerId: string;
  appearances: number;
  minutes: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  averageRating: number | null;
}

export interface Countdown {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}
