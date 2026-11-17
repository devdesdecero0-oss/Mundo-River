import type {
  MatchEvent,
  Player,
  PlayerMatchStats,
  RankingEntry,
} from "@/domain/types";

export interface RankingOptions {
  /** Si se pasa, solo se consideran eventos de esos partidos. */
  matchIds?: readonly string[];
  /** Estadísticas individuales para minutos, asistencias y desempates. */
  playerStats?: readonly PlayerMatchStats[];
  /**
   * Usa `goals` y `assists` de las estadísticas cuando la fuente no entrega
   * incidencias (evita depender de eventos vacíos). No combinar con eventos.
   */
  statsOnly?: boolean;
}

interface Tally {
  goals: number;
  assists: number;
  minutes: number;
}

const SCORING_EVENTS = new Set(["goal", "penalty_goal"]);

function tallyEvents(
  players: readonly Player[],
  events: readonly MatchEvent[],
  options: RankingOptions,
): Map<string, Tally> {
  const matchIds = options.matchIds ? new Set(options.matchIds) : null;
  const tally = new Map<string, Tally>();
  const playerIds = new Set(players.map((player) => player.id));

  const ensure = (playerId: string): Tally | null => {
    if (!playerIds.has(playerId)) return null;
    const current = tally.get(playerId);
    if (current) return current;
    const created: Tally = { goals: 0, assists: 0, minutes: 0 };
    tally.set(playerId, created);
    return created;
  };

  for (const event of events) {
    if (matchIds && !matchIds.has(event.matchId)) continue;

    if (SCORING_EVENTS.has(event.type)) {
      const scorer = ensure(event.playerId);
      if (scorer) scorer.goals += 1;
      // La asistencia solo se acredita en goles de jugada; los penales no llevan asistencia.
      if (event.type === "goal" && event.relatedPlayerId) {
        const assistant = ensure(event.relatedPlayerId);
        if (assistant) assistant.assists += 1;
      }
    }
  }

  for (const stats of options.playerStats ?? []) {
    if (matchIds && !matchIds.has(stats.matchId)) continue;
    const entry = ensure(stats.playerId);
    if (!entry) continue;
    entry.minutes += stats.minutes;
    if (options.statsOnly) {
      entry.goals += stats.goals;
      entry.assists += stats.assists;
    }
  }

  return tally;
}

function lastName(name: string): string {
  const tokens = name.trim().split(/\s+/);
  return tokens[tokens.length - 1] ?? name;
}

function byName(a: Player, b: Player): number {
  return lastName(a.name).localeCompare(lastName(b.name), "es-AR");
}

function toEntries(
  players: readonly Player[],
  tally: Map<string, Tally>,
  valueOf: (tally: Tally) => number,
  hasValue: (tally: Tally) => boolean,
  compare: (a: Tally, b: Tally, playerA: Player, playerB: Player) => number,
): RankingEntry[] {
  const playerById = new Map(players.map((player) => [player.id, player]));

  const rows = [...tally.entries()]
    .filter(([, values]) => hasValue(values))
    .map(([playerId, values]) => {
      const player = playerById.get(playerId);
      return player ? { player, values } : null;
    })
    .filter((row): row is { player: Player; values: Tally } => row !== null);

  rows.sort(
    (a, b) =>
      compare(a.values, b.values, a.player, b.player) || a.player.id.localeCompare(b.player.id),
  );

  const topValue = rows[0] ? valueOf(rows[0].values) : null;
  const topCount = topValue === null ? 0 : rows.filter((row) => valueOf(row.values) === topValue).length;

  return rows.map(({ player, values }) => ({
    playerId: player.id,
    player,
    value: valueOf(values),
    goals: values.goals,
    assists: values.assists,
    minutes: values.minutes,
    isTied: topCount > 1 && valueOf(values) === topValue,
  }));
}

/**
 * R-RANK — Goleadores: goles ↓, asistencias ↓, minutos ↑, apellido ↑.
 * Los autogoles no se acreditan al jugador.
 */
export function computeScorers(
  players: readonly Player[],
  events: readonly MatchEvent[],
  options: RankingOptions = {},
): RankingEntry[] {
  const tally = tallyEvents(players, events, options);
  return toEntries(
    players,
    tally,
    (values) => values.goals,
    (values) => values.goals > 0,
    (a, b, playerA, playerB) =>
      b.goals - a.goals ||
      b.assists - a.assists ||
      a.minutes - b.minutes ||
      byName(playerA, playerB),
  );
}

/**
 * R-RANK — Asistentes: asistencias ↓, goles ↓, minutos ↑, apellido ↑.
 */
export function computeAssists(
  players: readonly Player[],
  events: readonly MatchEvent[],
  options: RankingOptions = {},
): RankingEntry[] {
  const tally = tallyEvents(players, events, options);
  return toEntries(
    players,
    tally,
    (values) => values.assists,
    (values) => values.assists > 0,
    (a, b, playerA, playerB) =>
      b.assists - a.assists ||
      b.goals - a.goals ||
      a.minutes - b.minutes ||
      byName(playerA, playerB),
  );
}

export interface PlayerTotalsOptions {
  playerId: string;
  events: readonly MatchEvent[];
  playerStats: readonly PlayerMatchStats[];
  /** Toma goles, asistencias y tarjetas de las estadísticas si no hay eventos. */
  statsOnly?: boolean;
}

/** Totales de temporada de un jugador derivados de los mismos eventos y partidos. */
export function computePlayerSeasonTotals({
  playerId,
  events,
  playerStats,
  statsOnly = false,
}: PlayerTotalsOptions) {
  const ownEvents = events.filter((event) => event.playerId === playerId);
  const stats = playerStats.filter((row) => row.playerId === playerId);

  const goals = statsOnly
    ? stats.reduce((total, row) => total + row.goals, 0)
    : ownEvents.filter((event) => SCORING_EVENTS.has(event.type)).length;
  const assists = statsOnly
    ? stats.reduce((total, row) => total + row.assists, 0)
    : events.filter(
        (event) => event.type === "goal" && event.relatedPlayerId === playerId,
      ).length;
  const minutes = stats.reduce((total, row) => total + row.minutes, 0);
  const ratings = stats
    .map((row) => row.rating)
    .filter((rating): rating is number => rating !== null && Number.isFinite(rating));
  const averageRating =
    ratings.length === 0
      ? null
      : round1(ratings.reduce((total, rating) => total + rating, 0) / ratings.length);

  return {
    playerId,
    appearances: stats.length,
    minutes,
    goals,
    assists,
    yellowCards: statsOnly
      ? stats.reduce((total, row) => total + row.cards.yellow, 0)
      : ownEvents.filter((event) => event.type === "yellow").length,
    redCards: statsOnly
      ? stats.reduce((total, row) => total + row.cards.red, 0)
      : ownEvents.filter(
          (event) => event.type === "red" || event.type === "second_yellow",
        ).length,
    averageRating,
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
