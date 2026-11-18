import { describe, expect, it } from "vitest";
import { buildSquadPerformance, formatPlayerMatchLabel } from "@/domain/stats/squad-performance";
import type { Competition, Match, Player, PlayerMatchStats, Team } from "@/domain/types";

const players: Player[] = [
  {
    id: "p1",
    name: "Jugador Uno",
    displayName: "Jugador Uno",
    shirtNumber: 10,
    position: "MF",
    nationality: "Argentina",
  },
  {
    id: "p2",
    name: "Jugador Dos",
    displayName: "Jugador Dos",
    shirtNumber: 2,
    position: "DF",
    nationality: "Argentina",
  },
];

const teams: Team[] = [
  { id: "river", name: "River Plate", shortName: "River", crest: "", primaryColor: "", secondaryColor: "" },
  { id: "rival", name: "Boca Juniors", shortName: "Boca", crest: "", primaryColor: "", secondaryColor: "" },
];

const competitions: Competition[] = [
  {
    id: "liga-2026",
    slug: "liga-profesional",
    name: "Liga Profesional",
    shortName: "Liga",
    type: "league",
    seasonLabel: "2026",
  },
  {
    id: "amistosos-2026",
    slug: "amistosos",
    name: "Amistosos",
    shortName: "Amistosos",
    type: "friendly",
    seasonLabel: "2026",
  },
];

function match(id: string, finishedAt?: string): Match {
  return {
    id,
    seasonId: "2026",
    competitionId: "liga-2026",
    round: id,
    kickoffAt: "2026-01-01T20:00:00Z",
    venue: "Monumental",
    homeTeamId: "river",
    awayTeamId: "rival",
    finishedAt,
    score: finishedAt ? { home: 1, away: 0 } : undefined,
    events: [],
  };
}

function stats(matchId: string, playerId: string, rating: number | null): PlayerMatchStats {
  return {
    matchId,
    playerId,
    minutes: 90,
    rating,
    goals: 0,
    assists: 0,
    shots: 0,
    shotsOnTarget: 0,
    cards: { yellow: 0, red: 0 },
  };
}

describe("R-SQUAD-PERFORMANCE — puntaje del plantel", () => {
  it("divide la suma de notas por todos los partidos finalizados de River", () => {
    const result = buildSquadPerformance(
      players,
      [match("m1", "2026-01-01T22:00:00Z"), match("m2", "2026-01-03T22:00:00Z"), match("m3", "2026-01-05T22:00:00Z"), match("m4", "2026-01-07T22:00:00Z")],
      [stats("m1", "p1", 6), stats("m2", "p1", 5)],
    );

    expect(result[0]).toMatchObject({
      playerId: "p1",
      score: 2.8,
      ratedMatches: 2,
      finishedMatches: 4,
      evaluatedMatchIds: ["m1", "m2"],
    });
  });

  it("ignora partidos no finalizados y deja SC sin notas válidas", () => {
    const result = buildSquadPerformance(
      players,
      [match("m1", "2026-01-01T22:00:00Z"), match("m2")],
      [stats("m1", "p1", null), stats("m2", "p2", 12)],
    );

    expect(result.find((row) => row.playerId === "p1")?.score).toBeNull();
    expect(result.find((row) => row.playerId === "p2")?.score).toBeNull();
    expect(result.every((row) => row.status === "SC")).toBe(true);
  });

  it("ordena puntajes descendentes y SC al final", () => {
    const result = buildSquadPerformance(
      players,
      [match("m1", "2026-01-01T22:00:00Z")],
      [stats("m1", "p2", 8), stats("m1", "p1", null)],
    );

    expect(result.map((row) => [row.playerId, row.status])).toEqual([
      ["p2", "8.0"],
      ["p1", "SC"],
    ]);
  });

  it("deduplica una estadística repetida para el mismo jugador y partido", () => {
    const result = buildSquadPerformance(
      players,
      [match("m1", "2026-01-01T22:00:00Z")],
      [stats("m1", "p1", 6), stats("m1", "p1", 9)],
    );

    expect(result.find((row) => row.playerId === "p1")?.score).toBe(9);
    expect(result.find((row) => row.playerId === "p1")?.ratedMatches).toBe(1);
  });

  it("ordena los partidos evaluados del más reciente al más antiguo", () => {
    const result = buildSquadPerformance(
      players,
      [
        { ...match("m1", "2026-01-01T22:00:00Z"), kickoffAt: "2026-01-01T20:00:00Z" },
        { ...match("m2", "2026-01-03T22:00:00Z"), kickoffAt: "2026-01-03T20:00:00Z" },
      ],
      [stats("m1", "p1", 6), stats("m2", "p1", 8)],
    );

    expect(result.find((row) => row.playerId === "p1")?.evaluatedMatchIds).toEqual(["m2", "m1"]);
  });

  it("forma el partido con fecha y localía de River", () => {
    const local = formatPlayerMatchLabel(
      { ...match("m1", "2026-01-01T22:00:00Z"), round: "Matchday 14" },
      teams,
    );
    const visitante = formatPlayerMatchLabel(
      {
        ...match("m2", "2026-01-03T22:00:00Z"),
        round: "Fecha 15",
        homeTeamId: "rival",
        awayTeamId: "river",
      },
      teams,
    );

    expect(local).toMatchObject({ round: "Fecha 14", fixture: "River Plate vs Boca Juniors" });
    expect(visitante).toMatchObject({ round: "Fecha 15", fixture: "Boca Juniors vs River Plate" });
  });

  it("registra el amistoso pero no lo incluye en ningún número del plantel", () => {
    const friendly = {
      ...match("amistoso", "2026-01-04T22:00:00Z"),
      competitionId: "amistosos-2026",
    };
    const result = buildSquadPerformance(
      players,
      [match("m1", "2026-01-01T22:00:00Z"), friendly],
      [stats("m1", "p1", 6), stats("amistoso", "p1", 10)],
      "river",
      competitions,
    );

    const player = result.find((row) => row.playerId === "p1");
    expect(player).toMatchObject({
      score: 6,
      ratedMatches: 1,
      finishedMatches: 1,
      evaluatedMatchIds: ["m1"],
    });
  });
});
