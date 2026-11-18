import type { Match, Player, PlayerMatchStats } from "@/domain/types";
import { isFinishedMatch } from "./record";
import { normalizeRating } from "./ratings";

export interface SquadPerformance {
  player: Player;
  playerId: string;
  score: number | null;
  status: string;
  ratedMatches: number;
  finishedMatches: number;
  evaluatedMatchIds: string[];
}

export function buildSquadPerformance(
  players: readonly Player[],
  matches: readonly Match[],
  playerStats: readonly PlayerMatchStats[],
  teamId = "river",
): SquadPerformance[] {
  const finishedMatches = matches.filter(
    (match) =>
      isFinishedMatch(match) &&
      (match.homeTeamId === teamId || match.awayTeamId === teamId),
  );
  const finishedIds = new Set(finishedMatches.map((match) => match.id));
  const matchById = new Map(finishedMatches.map((match) => [match.id, match]));
  const statsByPlayer = new Map<string, Map<string, PlayerMatchStats>>();

  for (const row of playerStats) {
    if (!finishedIds.has(row.matchId)) continue;
    const byMatch = statsByPlayer.get(row.playerId) ?? new Map<string, PlayerMatchStats>();
    byMatch.set(row.matchId, row);
    statsByPlayer.set(row.playerId, byMatch);
  }

  return players
    .map((player) => {
      const rows = [...(statsByPlayer.get(player.id)?.values() ?? [])];
      const ratedRows = rows
        .map((row) => ({ row, rating: normalizeRating(row.rating) }))
        .filter((item): item is { row: PlayerMatchStats; rating: number } => item.rating !== null);
      ratedRows.sort(
        (a, b) =>
          new Date(matchById.get(b.row.matchId)?.kickoffAt ?? 0).getTime() -
          new Date(matchById.get(a.row.matchId)?.kickoffAt ?? 0).getTime(),
      );
      const score =
        ratedRows.length === 0
          ? null
          : round1(
              ratedRows.reduce((total, item) => total + item.rating, 0) /
                finishedMatches.length,
            );

      return {
        player,
        playerId: player.id,
        score,
        status: score === null ? "SC" : score.toFixed(1),
        ratedMatches: ratedRows.length,
        finishedMatches: finishedMatches.length,
        evaluatedMatchIds: ratedRows.map((item) => item.row.matchId),
      };
    })
    .sort((a, b) => {
      if (a.score === null && b.score === null) {
        return a.player.displayName.localeCompare(b.player.displayName, "es-AR");
      }
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      return b.score - a.score || a.player.displayName.localeCompare(b.player.displayName, "es-AR");
    });
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
