import { describe, expect, it } from "vitest";
import {
  averageTeamRating,
  buildStatComparison,
  computeAssists,
  computeForm,
  computePlayerSeasonTotals,
  computeScorers,
  computeSeasonRecord,
  computeSplit,
  formatRating,
  isFinishedMatch,
  normalizeRating,
  ratingTone,
  selectMvp,
} from "@/domain/stats";
import { makeEvent, makeMatch, makePlayer, makeStats, makeTeamStats, RIVER_ID } from "@/test-utils/domain";
import type { Player } from "@/domain/types";

const players: Player[] = [
  makePlayer({ id: "p1", name: "Santiago Simón", position: "MF", shirtNumber: 8 }),
  makePlayer({ id: "p2", name: "Franco Mastantuono", position: "MF", shirtNumber: 30 }),
  makePlayer({ id: "p3", name: "Sebastián Driussi", position: "FW", shirtNumber: 9 }),
  makePlayer({ id: "p4", name: "Miguel Borja", position: "FW", shirtNumber: 7 }),
];

describe("R-RANK — goleadores y asistentes", () => {
  const events = [
    makeEvent({ id: "e1", type: "goal", playerId: "p1", relatedPlayerId: "p2", minute: 10 }),
    makeEvent({ id: "e2", type: "penalty_goal", playerId: "p3", minute: 20 }),
    makeEvent({ id: "e3", type: "own_goal", playerId: "p1", minute: 30 }),
    makeEvent({ id: "e4", type: "goal", playerId: "p3", relatedPlayerId: "p1", minute: 40 }),
    makeEvent({ id: "e5", type: "goal", playerId: "p4", relatedPlayerId: "p2", minute: 50 }),
    makeEvent({ id: "e6", type: "goal", playerId: "p1", relatedPlayerId: "p2", minute: 60 }),
    makeEvent({ id: "e7", type: "goal", playerId: "p2", minute: 70 }),
    makeEvent({ id: "e8", type: "yellow", playerId: "p2", minute: 80 }),
  ];
  const playerStats = [
    makeStats({ playerId: "p1", minutes: 900 }),
    makeStats({ playerId: "p2", minutes: 800 }),
    makeStats({ playerId: "p3", minutes: 700 }),
    makeStats({ playerId: "p4", minutes: 600 }),
  ];

  it("cuenta goles y penales, pero no autogoles", () => {
    const ranking = computeScorers(players, events, { playerStats });
    expect(ranking.map((entry) => [entry.playerId, entry.goals])).toEqual([
      ["p1", 2],
      ["p3", 2],
      ["p2", 1],
      ["p4", 1],
    ]);
  });

  it("desempata por asistencias, minutos y apellido", () => {
    const ranking = computeScorers(players, events, { playerStats });
    expect(ranking.map((entry) => entry.playerId)).toEqual(["p1", "p3", "p2", "p4"]);
    expect(ranking[0]!.isTied).toBe(true); // p1 y p3 comparten 2 goles
    expect(ranking[1]!.isTied).toBe(true);
  });

  it("marca empate técnico cuando comparten la primera posición", () => {
    const tiedEvents = [
      makeEvent({ id: "t1", playerId: "p3" }),
      makeEvent({ id: "t2", playerId: "p4" }),
    ];
    const ranking = computeScorers(players, tiedEvents);
    expect(ranking.every((entry) => entry.isTied)).toBe(true);
  });

  it("ordena asistentes y solo incluye asistencias registradas", () => {
    const ranking = computeAssists(players, events, { playerStats });
    expect(ranking.map((entry) => [entry.playerId, entry.assists])).toEqual([
      ["p2", 3],
      ["p1", 1],
    ]);
  });

  it("filtra por partidos cuando se solicita", () => {
    const mixed = [
      makeEvent({ id: "m1", matchId: "match-1", playerId: "p1" }),
      makeEvent({ id: "m2", matchId: "match-2", playerId: "p2" }),
    ];
    const ranking = computeScorers(players, mixed, { matchIds: ["match-2"] });
    expect(ranking.map((entry) => entry.playerId)).toEqual(["p2"]);
  });

  it("omite eventos de jugadores inexistentes (FR-050)", () => {
    const ranking = computeScorers(
      players,
      [makeEvent({ id: "x", playerId: "fantasma" }), makeEvent({ id: "y", playerId: "p1" })],
    );
    expect(ranking.map((entry) => entry.playerId)).toEqual(["p1"]);
  });

  it("devuelve un ranking vacío sin eventos", () => {
    expect(computeScorers(players, [])).toEqual([]);
    expect(computeAssists(players, [])).toEqual([]);
  });

  it("usa goles y asistencias de las estadísticas cuando no hay incidencias", () => {
    const statsOnly = [
      makeStats({ playerId: "p1", goals: 2, assists: 1, minutes: 900 }),
      makeStats({ playerId: "p2", goals: 0, assists: 3, minutes: 800 }),
    ];
    const scorers = computeScorers(players, [], { playerStats: statsOnly, statsOnly: true });
    const assistants = computeAssists(players, [], { playerStats: statsOnly, statsOnly: true });

    expect(scorers.map((entry) => [entry.playerId, entry.goals])).toEqual([["p1", 2]]);
    expect(assistants.map((entry) => [entry.playerId, entry.assists])).toEqual([
      ["p2", 3],
      ["p1", 1],
    ]);
  });

  it("calcula totales de temporada de un jugador", () => {
    const totals = computePlayerSeasonTotals({
      playerId: "p2",
      events,
      playerStats: [
        makeStats({ playerId: "p2", rating: 7, minutes: 90 }),
        makeStats({ playerId: "p2", rating: 8, minutes: 80 }),
        makeStats({ playerId: "p2", rating: null, minutes: 10 }),
        makeStats({ playerId: "p1", rating: 9, minutes: 90 }),
      ],
    });
    expect(totals).toMatchObject({
      appearances: 3,
      minutes: 180,
      goals: 1,
      assists: 3,
      yellowCards: 1,
      redCards: 0,
      averageRating: 7.5,
    });
  });

  it("calcula totales desde estadísticas cuando no hay incidencias", () => {
    const totals = computePlayerSeasonTotals({
      playerId: "p2",
      events: [],
      playerStats: [
        makeStats({ playerId: "p2", goals: 2, assists: 1, minutes: 90, cards: { yellow: 1, red: 0 } }),
        makeStats({ playerId: "p2", goals: 1, assists: 0, minutes: 80, cards: { yellow: 0, red: 1 } }),
      ],
      statsOnly: true,
    });
    expect(totals).toMatchObject({
      appearances: 2,
      minutes: 170,
      goals: 3,
      assists: 1,
      yellowCards: 1,
      redCards: 1,
    });
  });
});

describe("R-RECORD — registro de temporada", () => {
  const finished = (
    id: string,
    kickoffAt: string,
    home: number,
    away: number,
    homeTeamId = RIVER_ID,
    awayTeamId = "rival",
  ) =>
    makeMatch({
      id,
      kickoffAt,
      homeTeamId,
      awayTeamId,
      score: { home, away },
      finishedAt: new Date(new Date(kickoffAt).getTime() + 7_200_000).toISOString(),
    });

  const matches = [
    finished("m1", "2026-03-01T22:00:00Z", 2, 0),
    finished("m2", "2026-03-08T22:00:00Z", 0, 1, "rival", RIVER_ID),
    finished("m3", "2026-03-15T22:00:00Z", 1, 1),
    finished("m4", "2026-03-22T22:00:00Z", 2, 1, "rival", RIVER_ID),
    finished("m5", "2026-03-29T22:00:00Z", 3, 0),
    makeMatch({ id: "future", kickoffAt: "2026-12-01T22:00:00Z" }),
  ];

  it("solo cuenta partidos finalizados y calcula efectividad", () => {
    const record = computeSeasonRecord(matches, RIVER_ID);
    expect(record).toEqual({
      played: 5,
      won: 3,
      drawn: 1,
      lost: 1,
      goalsFor: 8,
      goalsAgainst: 3,
      goalDiff: 5,
      points: 10,
      effectiveness: 66.7,
      winRate: 60,
    });
  });

  it("reconoce como finalizado un partido del proveedor con providerStatus finished", () => {
    const providerMatch = makeMatch({
      id: "bzzoiro:event:123",
      homeTeamId: RIVER_ID,
      awayTeamId: "rival",
      providerStatus: "finished",
      score: { home: 2, away: 1 },
    });

    expect(isFinishedMatch(providerMatch)).toBe(true);
    expect(computeSeasonRecord([providerMatch], RIVER_ID)).toMatchObject({
      played: 1,
      won: 1,
      goalsFor: 2,
      goalsAgainst: 1,
      points: 3,
    });
    expect(computeForm([providerMatch], RIVER_ID)).toEqual(["W"]);
    expect(computeSplit([providerMatch], RIVER_ID).home).toMatchObject({
      played: 1,
      won: 1,
    });
  });

  it("devuelve un registro vacío sin partidos", () => {
    expect(computeSeasonRecord([], RIVER_ID)).toEqual({
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
    });
  });

  it("calcula la forma del más reciente al más antiguo", () => {
    expect(computeForm(matches, RIVER_ID)).toEqual(["W", "L", "D", "W", "W"]);
    expect(computeForm(matches, RIVER_ID, 2)).toEqual(["W", "L"]);
    expect(computeForm(matches, RIVER_ID, 0)).toEqual([]);
  });

  it("desglosa local y visitante", () => {
    const split = computeSplit(matches, RIVER_ID);
    expect(split.home).toMatchObject({ played: 3, won: 2, drawn: 1, lost: 0, goalsFor: 6, goalsAgainst: 1 });
    expect(split.away).toMatchObject({ played: 2, won: 1, drawn: 0, lost: 1, goalsFor: 2, goalsAgainst: 2 });
  });

  it("genera comparativas de estadísticas proporcionales", () => {
    const stats = buildStatComparison({
      home: makeTeamStats({ possession: 60, shots: 0 }),
      away: makeTeamStats({ possession: 40, shots: 0 }),
    });
    expect(stats.find((row) => row.key === "possession")).toMatchObject({
      home: 60,
      away: 40,
      homeRatio: 60,
      awayRatio: 40,
      suffix: "%",
    });
    expect(stats.find((row) => row.key === "shots")).toMatchObject({
      homeRatio: 50,
      awayRatio: 50,
    });
    expect(stats).toHaveLength(8);
    expect(buildStatComparison(undefined)).toEqual([]);
  });
});

describe("R-RATING — calificaciones y MVP", () => {
  it("normaliza notas válidas y descarta las inválidas", () => {
    expect(normalizeRating(7.44)).toBe(7.4);
    expect(normalizeRating(7.45)).toBe(7.5);
    expect(normalizeRating(10)).toBe(10);
    expect(normalizeRating(10.1)).toBeNull();
    expect(normalizeRating(0.4)).toBeNull();
    expect(normalizeRating(null)).toBeNull();
    expect(normalizeRating(Number.NaN)).toBeNull();
  });

  it("elige MVP por nota, minutos y aporte, excluyendo SC", () => {
    const stats = [
      makeStats({ playerId: "a", rating: 8.1, minutes: 90, goals: 0, assists: 0 }),
      makeStats({ playerId: "b", rating: 8.1, minutes: 80, goals: 2, assists: 1 }),
      makeStats({ playerId: "c", rating: null, minutes: 90, goals: 3, assists: 0 }),
      makeStats({ playerId: "d", rating: 7.4, minutes: 90, goals: 1, assists: 0 }),
    ];
    expect(selectMvp(stats)?.playerId).toBe("a");
    expect(selectMvp([makeStats({ rating: null })])).toBeNull();
    expect(selectMvp([])).toBeNull();
  });

  it("promedia notas excluyendo SC", () => {
    expect(
      averageTeamRating([
        makeStats({ playerId: "a", rating: 7 }),
        makeStats({ playerId: "b", rating: 8 }),
        makeStats({ playerId: "c", rating: null }),
      ]),
    ).toBe(7.5);
    expect(averageTeamRating([])).toBeNull();
    expect(averageTeamRating([makeStats({ rating: null })])).toBeNull();
  });

  it("formatea notas y define tono semántico", () => {
    expect(formatRating(7.4)).toBe("7,4");
    expect(formatRating(null)).toBe("SC");
    expect(ratingTone(8)).toBe("high");
    expect(ratingTone(6.5)).toBe("mid");
    expect(ratingTone(5)).toBe("low");
    expect(ratingTone(null)).toBe("none");
  });
});
