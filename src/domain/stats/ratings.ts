import type { PlayerMatchStats } from "@/domain/types";

/** Una nota válida está entre 1,0 y 10,0; se normaliza a un decimal. */
export function normalizeRating(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  if (value < 1 || value > 10) return null;
  return Math.round(value * 10) / 10;
}

/**
 * R-RATING — MVP del partido: nota ↓ → minutos ↓ → goles+asistencias ↓ →
 * id ascendente como desempate estable.
 */
export function selectMvp(stats: readonly PlayerMatchStats[]): PlayerMatchStats | null {
  const rated = stats.filter((row) => normalizeRating(row.rating) !== null);
  if (rated.length === 0) return null;

  return [...rated].sort((a, b) => {
    const ratingDiff = (normalizeRating(b.rating) ?? 0) - (normalizeRating(a.rating) ?? 0);
    if (ratingDiff !== 0) return ratingDiff;
    if (b.minutes !== a.minutes) return b.minutes - a.minutes;
    const contributionDiff = b.goals + b.assists - (a.goals + a.assists);
    if (contributionDiff !== 0) return contributionDiff;
    return a.playerId.localeCompare(b.playerId);
  })[0] ?? null;
}

/** R-RATING — Promedio del equipo excluyendo «SC» (rating null). */
export function averageTeamRating(stats: readonly PlayerMatchStats[]): number | null {
  const ratings = stats
    .map((row) => normalizeRating(row.rating))
    .filter((rating): rating is number => rating !== null);
  if (ratings.length === 0) return null;
  const average = ratings.reduce((total, rating) => total + rating, 0) / ratings.length;
  return Math.round(average * 10) / 10;
}

/** Nota formateada para UI: `7,4` o `SC`. */
export function formatRating(rating: number | null | undefined): string {
  const normalized = normalizeRating(rating);
  return normalized === null ? "SC" : normalized.toFixed(1).replace(".", ",");
}

/** Color semántico de la nota, sin depender solo del color en la UI. */
export function ratingTone(rating: number | null | undefined): "high" | "mid" | "low" | "none" {
  const normalized = normalizeRating(rating);
  if (normalized === null) return "none";
  if (normalized >= 7.5) return "high";
  if (normalized >= 6) return "mid";
  return "low";
}
