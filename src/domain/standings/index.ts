import type { FormResult } from "@/domain/types";

export const REGULAR_LEAGUE_STAGES = new Set(["group-stage", "league-phase"]);

export interface StandingsMatch {
  id: string;
  stage: string | null | undefined;
  status: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
}

export interface StandingRow {
  position: number;
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: FormResult[];
  zone?: string | null;
}

export interface SelectedGroup {
  name: string;
  rows: StandingRow[];
}

interface StandingTally {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  results: Array<{ kickoff: string; result: FormResult }>;
}

export interface LigaProfesionalStandings {
  seasonLabel: string;
  annual: StandingRow[];
  riverGroup: SelectedGroup | null;
}

export function isRegularLeagueStage(stage: string | null | undefined): boolean {
  return stage !== undefined && stage !== null && REGULAR_LEAGUE_STAGES.has(stage);
}

export function buildStandings(matches: readonly StandingsMatch[]): StandingRow[] {
  const rows = new Map<string, StandingTally>();

  const ensure = (teamId: string, teamName: string) => {
    const existing = rows.get(teamId);
    if (existing) return existing;
    const created: StandingTally = {
      teamId,
      teamName,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      results: [],
    };
    rows.set(teamId, created);
    return created;
  };

  for (const match of matches) {
    if (
      match.status !== "finished" ||
      !isRegularLeagueStage(match.stage) ||
      typeof match.homeScore !== "number" ||
      typeof match.awayScore !== "number"
    ) {
      continue;
    }

    const home = ensure(match.homeTeamId, match.homeTeamName);
    const away = ensure(match.awayTeamId, match.awayTeamName);
    home.played += 1;
    away.played += 1;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won += 1;
      home.points += 3;
      home.results.push({ kickoff: match.id, result: "W" });
      away.lost += 1;
      away.results.push({ kickoff: match.id, result: "L" });
    } else if (match.homeScore < match.awayScore) {
      away.won += 1;
      away.points += 3;
      away.results.push({ kickoff: match.id, result: "W" });
      home.lost += 1;
      home.results.push({ kickoff: match.id, result: "L" });
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
      home.results.push({ kickoff: match.id, result: "D" });
      away.results.push({ kickoff: match.id, result: "D" });
    }
  }

  return [...rows.values()]
    .map(({ results, ...row }) => ({
      ...row,
      goalDifference: row.goalsFor - row.goalsAgainst,
      form: results.slice(-5).reverse().map((item) => item.result),
      position: 0,
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.teamName.localeCompare(b.teamName, "es-AR"),
    )
    .map((row, index) => ({ ...row, position: index + 1 }));
}

export function selectGroupForTeam(
  groups: Readonly<Record<string, readonly StandingRow[]>>,
  teamId: string,
): SelectedGroup | null {
  for (const [name, rows] of Object.entries(groups)) {
    if (rows.some((row) => row.teamId === teamId)) {
      return { name, rows: [...rows] };
    }
  }
  return null;
}
