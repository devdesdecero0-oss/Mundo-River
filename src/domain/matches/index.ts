import { getMonthKey, toLocalDateKey } from "@/domain/time";
import type { H2HSummary, Lineup, Match, MatchStatus } from "@/domain/types";
import { deriveMatchStatus, isLiveStatus } from "./status";

export interface MatchFilters {
  competitionId?: string;
  seasonId?: string;
  monthKey?: string;
  status?: MatchStatus | "all";
  now: Date | string;
  timeZone: string;
}

export type SortOrder = "asc" | "desc";

export interface MatchDayGroup {
  dateKey: ReturnType<typeof toLocalDateKey>;
  matches: Match[];
}

/** R-ORDER — Ordena por kickoff con desempate estable por id. */
export function sortMatches(matches: readonly Match[], order: SortOrder = "asc"): Match[] {
  const direction = order === "asc" ? 1 : -1;
  return [...matches].sort((a, b) => {
    const diff = new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime();
    if (diff !== 0) return diff * direction;
    return a.id.localeCompare(b.id);
  });
}

/** R-ORDER — Filtros combinables (AND) sin mutar la entrada. */
export function filterMatches(matches: readonly Match[], filters: MatchFilters): Match[] {
  return matches.filter((match) => {
    if (filters.competitionId && match.competitionId !== filters.competitionId) return false;
    if (filters.seasonId && match.seasonId !== filters.seasonId) return false;
    if (filters.monthKey && getMonthKey(match.kickoffAt, filters.timeZone) !== filters.monthKey) {
      return false;
    }
    if (filters.status && filters.status !== "all") {
      if (deriveMatchStatus(match, filters.now) !== filters.status) return false;
    }
    return true;
  });
}

/** R-ORDER — Agrupa por día local y ordena por kickoff ascendente. */
export function groupMatchesByLocalDate(
  matches: readonly Match[],
  timeZone: string,
): MatchDayGroup[] {
  const groups = new Map<string, Match[]>();

  for (const match of sortMatches(matches, "asc")) {
    const dateKey = toLocalDateKey(match.kickoffAt, timeZone);
    const bucket = groups.get(dateKey);
    if (bucket) bucket.push(match);
    else groups.set(dateKey, [match]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, dayMatches]) => ({
      dateKey: dateKey as ReturnType<typeof toLocalDateKey>,
      matches: dayMatches,
    }));
}

/**
 * Próximo partido: prioriza uno en juego; si no, el programado más cercano.
 */
export function getNextMatch(
  matches: readonly Match[],
  now: Date | string,
): Match | null {
  const sorted = sortMatches(matches, "asc");
  const live = sorted.find((match) => isLiveStatus(deriveMatchStatus(match, now)));
  if (live) return live;
  return (
    sorted.find((match) => {
      const status = deriveMatchStatus(match, now);
      return status === "scheduled" && new Date(match.kickoffAt).getTime() >= new Date(now).getTime();
    }) ?? null
  );
}

/** Último resultado finalizado (más reciente primero). */
export function getLastResult(matches: readonly Match[], now: Date | string): Match | null {
  return (
    sortMatches(matches, "desc").find((match) => {
      if (!match.score) return false;
      if (deriveMatchStatus(match, now) !== "finished") return false;
      return new Date(match.kickoffAt).getTime() <= new Date(now).getTime();
    }) ?? null
  );
}

/** Próximos partidos programados, excluyendo el que se muestra como destacado. */
export function getUpcomingMatches(
  matches: readonly Match[],
  now: Date | string,
  limit = 3,
): Match[] {
  return sortMatches(matches, "asc")
    .filter((match) => deriveMatchStatus(match, now) === "scheduled")
    .slice(0, limit);
}

/** Partidos de un día local concreto, ordenados por hora. */
export function getMatchesForDateKey(
  matches: readonly Match[],
  dateKey: string,
  timeZone: string,
): Match[] {
  return sortMatches(
    matches.filter((match) => toLocalDateKey(match.kickoffAt, timeZone) === dateKey),
    "asc",
  );
}

/** Meses con actividad, derivados de los datos. */
export function getAvailableMonthKeys(matches: readonly Match[], timeZone: string): string[] {
  return [...new Set(matches.map((match) => getMonthKey(match.kickoffAt, timeZone)))].sort();
}

export function countMatchesByStatus(
  matches: readonly Match[],
  now: Date | string,
): Record<MatchStatus, number> {
  const counts: Record<MatchStatus, number> = {
    scheduled: 0,
    live: 0,
    halftime: 0,
    finished: 0,
    postponed: 0,
    suspended: 0,
    cancelled: 0,
  };
  for (const match of matches) counts[deriveMatchStatus(match, now)] += 1;
  return counts;
}

/**
 * R-LINEUP — Devuelve la formación de un equipo puntual.
 *
 * No cae a la formación del rival: si el proveedor todavía no publicó
 * la de River, la ficha debe mostrar "sin formación" antes que atribuirle
 * jugadores de otro equipo.
 */
export function selectLineupForTeam(
  lineups: readonly Lineup[] | undefined,
  teamId: string,
): Lineup | null {
  if (!lineups || lineups.length === 0) return null;
  return lineups.find((lineup) => lineup.teamId === teamId) ?? null;
}

/**
 * R-H2H — Historial agregado entre dos equipos a partir de los
 * partidos finalizados disponibles.
 */
export function computeHeadToHead(
  matches: readonly Match[],
  teamId: string,
  opponentId: string,
  now: Date | string,
): H2HSummary {
  const headToHead = matches.filter((match) => {
    if (deriveMatchStatus(match, now) !== "finished") return false;
    const pair = [match.homeTeamId, match.awayTeamId];
    return pair.includes(teamId) && pair.includes(opponentId);
  });

  const summary: H2HSummary = {
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  };

  for (const match of headToHead) {
    if (!match.score) continue;
    const isHome = match.homeTeamId === teamId;
    const scored = isHome ? match.score.home : match.score.away;
    const conceded = isHome ? match.score.away : match.score.home;

    summary.played += 1;
    summary.goalsFor += scored;
    summary.goalsAgainst += conceded;
    if (scored > conceded) summary.wins += 1;
    else if (scored === conceded) summary.draws += 1;
    else summary.losses += 1;
  }

  return summary;
}
