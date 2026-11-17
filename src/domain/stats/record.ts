import type {
  FormResult,
  Match,
  SeasonRecord,
  TeamMatchStats,
} from "@/domain/types";

export function isFinishedMatch(match: Match): boolean {
  return (
    match.providerStatus === "finished" ||
    match.statusOverride === "finished" ||
    (match.score !== undefined && match.finishedAt !== undefined)
  );
}

function resultFor(match: Match, teamId: string): FormResult | null {
  if (!match.score) return null;
  const isHome = match.homeTeamId === teamId;
  const scored = isHome ? match.score.home : match.score.away;
  const conceded = isHome ? match.score.away : match.score.home;
  if (scored > conceded) return "W";
  if (scored === conceded) return "D";
  return "L";
}

function emptyRecord(): SeasonRecord {
  return {
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
    effectiveness: 0,
    winRate: 0,
  };
}

/** R-RECORD — Registro de temporada sobre partidos finalizados. */
export function computeSeasonRecord(matches: readonly Match[], teamId: string): SeasonRecord {
  const record = emptyRecord();

  for (const match of matches) {
    if (!isFinishedMatch(match) || !match.score) continue;
    if (match.homeTeamId !== teamId && match.awayTeamId !== teamId) continue;

    const isHome = match.homeTeamId === teamId;
    const scored = isHome ? match.score.home : match.score.away;
    const conceded = isHome ? match.score.away : match.score.home;

    record.played += 1;
    record.goalsFor += scored;
    record.goalsAgainst += conceded;

    if (scored > conceded) record.won += 1;
    else if (scored === conceded) record.drawn += 1;
    else record.lost += 1;
  }

  record.goalDiff = record.goalsFor - record.goalsAgainst;
  record.points = record.won * 3 + record.drawn;
  record.effectiveness =
    record.played === 0 ? 0 : Math.round(((record.points / (record.played * 3)) * 100) * 10) / 10;
  record.winRate =
    record.played === 0 ? 0 : Math.round((record.won / record.played) * 1000) / 10;

  return record;
}

/** R-RECORD — Últimos `limit` resultados, del más reciente al más antiguo. */
export function computeForm(
  matches: readonly Match[],
  teamId: string,
  limit = 5,
): FormResult[] {
  return matches
    .filter((match) => isFinishedMatch(match) && match.score !== undefined)
    .filter((match) => match.homeTeamId === teamId || match.awayTeamId === teamId)
    .sort(
      (a, b) =>
        new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime() ||
        a.id.localeCompare(b.id),
    )
    .slice(0, Math.max(0, limit))
    .map((match) => resultFor(match, teamId))
    .filter((result): result is FormResult => result !== null);
}

/** R-RECORD — Desglose como local y como visitante. */
export function computeSplit(
  matches: readonly Match[],
  teamId: string,
): { home: SeasonRecord; away: SeasonRecord } {
  const finished = matches.filter((match) => isFinishedMatch(match));
  return {
    home: computeSeasonRecord(
      finished.filter((match) => match.homeTeamId === teamId),
      teamId,
    ),
    away: computeSeasonRecord(
      finished.filter((match) => match.awayTeamId === teamId),
      teamId,
    ),
  };
}

export interface StatComparison {
  key: keyof TeamMatchStats;
  label: string;
  home: number;
  away: number;
  homeRatio: number;
  awayRatio: number;
  suffix: string;
}

const STAT_LABELS: Array<{ key: keyof TeamMatchStats; label: string; suffix?: string }> = [
  { key: "possession", label: "Posesión", suffix: "%" },
  { key: "shots", label: "Tiros" },
  { key: "shotsOnTarget", label: "Tiros al arco" },
  { key: "corners", label: "Córners" },
  { key: "fouls", label: "Faltas" },
  { key: "offsides", label: "Offsides" },
  { key: "passes", label: "Pases" },
  { key: "passAccuracy", label: "Precisión de pases", suffix: "%" },
];

/** Comparativa de estadísticas con proporciones listas para barras accesibles. */
export function buildStatComparison(
  stats: { home: TeamMatchStats; away: TeamMatchStats } | undefined,
): StatComparison[] {
  if (!stats) return [];

  return STAT_LABELS.map(({ key, label, suffix }) => {
    const home = stats.home[key];
    const away = stats.away[key];
    const total = home + away;
    return {
      key,
      label,
      home,
      away,
      homeRatio: total === 0 ? 50 : Math.round((home / total) * 100),
      awayRatio: total === 0 ? 50 : 100 - Math.round((home / total) * 100),
      suffix: suffix ?? "",
    };
  });
}
