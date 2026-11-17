import { describe, expect, it } from "vitest";
import {
  buildStandings,
  isRegularLeagueStage,
  selectGroupForTeam,
  type StandingsMatch,
  type StandingRow,
} from "@/domain/standings";

function match(overrides: Partial<StandingsMatch> = {}): StandingsMatch {
  return {
    id: "m1",
    stage: "group-stage",
    status: "finished",
    homeTeamId: "river",
    homeTeamName: "River Plate",
    awayTeamId: "boca",
    awayTeamName: "Boca Juniors",
    homeScore: 2,
    awayScore: 1,
    ...overrides,
  };
}

describe("R-STANDINGS — fases regulares", () => {
  it("incluye group-stage y league-phase, pero excluye playoffs", () => {
    expect(isRegularLeagueStage("group-stage")).toBe(true);
    expect(isRegularLeagueStage("league-phase")).toBe(true);
    expect(isRegularLeagueStage("round-of-16")).toBe(false);
    expect(isRegularLeagueStage("final")).toBe(false);
  });

  it("calcula puntos, goles y posiciones con desempate por diferencia", () => {
    const rows = buildStandings([
      match(),
      match({ id: "m2", homeTeamId: "river", homeTeamName: "River Plate", awayTeamId: "ind", awayTeamName: "Independiente", homeScore: 1, awayScore: 1 }),
      match({ id: "m3", homeTeamId: "boca", homeTeamName: "Boca Juniors", awayTeamId: "ind", awayTeamName: "Independiente", homeScore: 0, awayScore: 0 }),
    ]);

    expect(rows.map((row) => [row.position, row.teamId, row.points, row.goalDifference])).toEqual([
      [1, "river", 4, 1],
      [2, "ind", 2, 0],
      [3, "boca", 1, -1],
    ]);
  });

  it("ignora partidos no finalizados y fases eliminatorias", () => {
    const rows = buildStandings([
      match({ status: "scheduled", homeScore: undefined, awayScore: undefined }),
      match({ id: "playoff", stage: "round-of-16", homeScore: 5, awayScore: 0 }),
    ]);

    expect(rows).toEqual([]);
  });
});

describe("R-STANDINGS — grupo de River", () => {
  const river: StandingRow = {
    position: 3,
    teamId: "river",
    teamName: "River Plate",
    played: 8,
    won: 4,
    drawn: 2,
    lost: 2,
    goalsFor: 12,
    goalsAgainst: 8,
    goalDifference: 4,
    points: 14,
    form: ["W", "D"],
    zone: "playoff",
  };
  const groups = {
    "Clausura, Group A": [river],
    "Clausura, Group B": [
      { ...river, teamId: "boca", teamName: "Boca Juniors" },
    ],
  };

  it("elige el grupo que contiene al equipo solicitado", () => {
    expect(selectGroupForTeam(groups, "river")).toEqual({
      name: "Clausura, Group A",
      rows: [river],
    });
  });

  it("devuelve null si el equipo no aparece", () => {
    expect(selectGroupForTeam(groups, "san-lorenzo")).toBeNull();
  });
});
