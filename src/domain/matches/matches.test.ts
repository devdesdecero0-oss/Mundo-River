import { describe, expect, it } from "vitest";
import {
  computeHeadToHead,
  countMatchesByStatus,
  filterMatches,
  getAvailableMonthKeys,
  getLastResult,
  getMatchesForDateKey,
  getNextMatch,
  getUpcomingMatches,
  groupMatchesByLocalDate,
  selectLineupForTeam,
  sortMatches,
} from "@/domain/matches";
import { computeMatchMinute, deriveMatchStatus, isLiveStatus } from "@/domain/matches/status";
import type { Lineup } from "@/domain/types";
import { makeMatch, RIVER_ID, TZ_AR } from "@/test-utils/domain";

const KICKOFF = "2026-03-14T23:30:00.000Z"; // 20:30 del 14/03 en Buenos Aires

describe("R-STATUS — estado del partido", () => {
  it("es programado antes del kickoff", () => {
    const match = makeMatch({ kickoffAt: KICKOFF });
    expect(deriveMatchStatus(match, "2026-03-14T23:29:59Z")).toBe("scheduled");
  });

  it("pasa a en vivo exactamente en el kickoff (caso borde 4)", () => {
    const match = makeMatch({ kickoffAt: KICKOFF });
    expect(deriveMatchStatus(match, KICKOFF)).toBe("live");
    expect(isLiveStatus("live")).toBe(true);
  });

  it("respeta el entretiempo explícito", () => {
    const match = makeMatch({ kickoffAt: KICKOFF, period: "HT" });
    expect(deriveMatchStatus(match, "2026-03-15T00:20:00Z")).toBe("halftime");
  });

  it("sigue en vivo justo antes del límite de 120 minutos (caso borde 5)", () => {
    const match = makeMatch({ kickoffAt: KICKOFF });
    expect(deriveMatchStatus(match, "2026-03-15T01:29:59Z")).toBe("live");
    expect(deriveMatchStatus(match, "2026-03-15T01:30:00Z")).toBe("finished");
  });

  it("admite ventana extendida para copas con alargue (caso borde 6)", () => {
    const match = makeMatch({ kickoffAt: KICKOFF, liveWindowMinutes: 150 });
    expect(deriveMatchStatus(match, "2026-03-15T01:45:00Z")).toBe("live");
  });

  it("prioriza los estados explícitos de la fuente", () => {
    expect(
      deriveMatchStatus(makeMatch({ statusOverride: "postponed" }), "2026-01-01T00:00:00Z"),
    ).toBe("postponed");
    expect(
      deriveMatchStatus(makeMatch({ statusOverride: "suspended" }), "2026-01-01T00:00:00Z"),
    ).toBe("suspended");
    expect(
      deriveMatchStatus(makeMatch({ statusOverride: "cancelled" }), "2026-01-01T00:00:00Z"),
    ).toBe("cancelled");
    expect(
      deriveMatchStatus(makeMatch({ statusOverride: "finished" }), "2026-01-01T00:00:00Z"),
    ).toBe("finished");
  });

  it("prioriza el estado informado por el proveedor sobre el reloj", () => {
    const live = makeMatch({ kickoffAt: KICKOFF, providerStatus: "live" });
    expect(deriveMatchStatus(live, "2026-03-16T12:00:00Z")).toBe("live");

    const postponed = makeMatch({ kickoffAt: KICKOFF, providerStatus: "postponed" });
    expect(deriveMatchStatus(postponed, KICKOFF)).toBe("postponed");

    const finished = makeMatch({ kickoffAt: KICKOFF, providerStatus: "finished" });
    expect(deriveMatchStatus(finished, KICKOFF)).toBe("finished");
  });

  it("finaliza si hay marcador y finishedAt", () => {
    const match = makeMatch({
      kickoffAt: KICKOFF,
      score: { home: 2, away: 0 },
      finishedAt: "2026-03-15T01:20:00Z",
    });
    expect(deriveMatchStatus(match, "2026-03-14T23:40:00Z")).toBe("finished");
  });

  it("rechaza fechas inválidas", () => {
    expect(() => deriveMatchStatus(makeMatch(), "fecha-invalida")).toThrow(RangeError);
  });
});

describe("R-TIME — minuto de juego", () => {
  it("devuelve null cuando no está en vivo", () => {
    expect(computeMatchMinute(makeMatch({ kickoffAt: KICKOFF }), "2026-03-14T20:00:00Z")).toBeNull();
    expect(computeMatchMinute(makeMatch({ kickoffAt: KICKOFF }), "2026-03-15T03:00:00Z")).toBeNull();
  });

  it("calcula el minuto del primer tiempo", () => {
    expect(computeMatchMinute(makeMatch({ kickoffAt: KICKOFF }), "2026-03-15T00:00:00Z")).toBe(30);
    expect(computeMatchMinute(makeMatch({ kickoffAt: KICKOFF }), KICKOFF)).toBe(1);
  });

  it("devuelve 45 en el entretiempo", () => {
    const match = makeMatch({ kickoffAt: KICKOFF, period: "HT" });
    expect(computeMatchMinute(match, "2026-03-15T00:30:00Z")).toBe(45);
  });

  it("descuenta el entretiempo en el segundo tiempo", () => {
    const match = makeMatch({ kickoffAt: KICKOFF, period: "2H" });
    expect(computeMatchMinute(match, "2026-03-15T01:05:00Z")).toBe(80);
  });

  it("respeta el descuento sin superar el máximo", () => {
    const match = makeMatch({
      kickoffAt: KICKOFF,
      period: "2H",
      stoppageSecondHalf: 5,
      liveWindowMinutes: 150,
    });
    expect(computeMatchMinute(match, "2026-03-15T01:29:00Z")).toBe(95);
    const withoutStoppage = makeMatch({ kickoffAt: KICKOFF, period: "2H" });
    expect(computeMatchMinute(withoutStoppage, "2026-03-15T01:29:00Z")).toBe(90);
  });

  it("usa el minuto informado por el proveedor", () => {
    const match = makeMatch({
      kickoffAt: KICKOFF,
      providerStatus: "live",
      providerMinute: 67,
    });
    expect(computeMatchMinute(match, "2026-03-14T23:40:00Z")).toBe(67);

    const kickoff = makeMatch({
      kickoffAt: KICKOFF,
      providerStatus: "live",
      providerMinute: 0,
    });
    expect(computeMatchMinute(kickoff, KICKOFF)).toBe(0);
  });

  it("ignora el minuto del proveedor cuando el partido no está en juego", () => {
    const match = makeMatch({
      kickoffAt: KICKOFF,
      providerStatus: "finished",
      providerMinute: 90,
    });
    expect(computeMatchMinute(match, "2026-03-15T02:00:00Z")).toBeNull();
  });

  it("gestiona el alargue y los penales", () => {
    const extra = makeMatch({ kickoffAt: KICKOFF, period: "ET", liveWindowMinutes: 150 });
    expect(computeMatchMinute(extra, "2026-03-15T01:35:00Z")).toBe(105);
    const penalties = makeMatch({ kickoffAt: KICKOFF, period: "PEN", liveWindowMinutes: 150 });
    expect(computeMatchMinute(penalties, "2026-03-15T01:55:00Z")).toBe(120);
  });
});

describe("R-ORDER — filtros, orden y agrupación", () => {
  const now = "2026-03-20T12:00:00Z";
  const matches = [
    makeMatch({ id: "b", kickoffAt: "2026-04-02T01:30:00Z", competitionId: "libertadores-2026" }),
    makeMatch({ id: "a", kickoffAt: "2026-03-14T23:30:00Z", competitionId: "liga-2026" }),
    makeMatch({
      id: "c",
      kickoffAt: "2026-03-14T23:30:00Z",
      competitionId: "copa-argentina-2026",
      statusOverride: "postponed",
    }),
    makeMatch({
      id: "d",
      kickoffAt: "2026-03-01T21:00:00Z",
      competitionId: "liga-2026",
      score: { home: 1, away: 0 },
      finishedAt: "2026-03-01T22:40:00Z",
    }),
  ];

  it("ordena por kickoff con desempate estable por id", () => {
    expect(sortMatches(matches, "asc").map((match) => match.id)).toEqual(["d", "a", "c", "b"]);
    expect(sortMatches(matches, "desc").map((match) => match.id)).toEqual(["b", "a", "c", "d"]);
    expect(matches.map((match) => match.id)).toEqual(["b", "a", "c", "d"]); // no muta
  });

  it("combina filtros de competición, mes y estado", () => {
    expect(
      filterMatches(matches, {
        competitionId: "liga-2026",
        monthKey: "2026-03",
        now,
        timeZone: TZ_AR,
      }).map((match) => match.id),
    ).toEqual(["a", "d"]);

    expect(
      filterMatches(matches, { status: "postponed", now, timeZone: TZ_AR }).map((match) => match.id),
    ).toEqual(["c"]);

    expect(
      filterMatches(matches, { status: "all", seasonId: "2026", now, timeZone: TZ_AR }),
    ).toHaveLength(4);
  });

  it("usa el mes local del usuario, no el mes UTC", () => {
    const lateKickoff = makeMatch({ id: "tz", kickoffAt: "2026-04-01T02:00:00Z" });
    expect(
      filterMatches([lateKickoff], { monthKey: "2026-03", now, timeZone: TZ_AR }),
    ).toHaveLength(1);
    expect(
      filterMatches([lateKickoff], { monthKey: "2026-04", now, timeZone: "Europe/Madrid" }),
    ).toHaveLength(1);
  });

  it("agrupa por día local ascendente", () => {
    const groups = groupMatchesByLocalDate(matches, TZ_AR);
    expect(groups.map((group) => group.dateKey)).toEqual(["2026-03-01", "2026-03-14", "2026-04-01"]);
    expect(groups[1]!.matches.map((match) => match.id)).toEqual(["a", "c"]);
  });

  it("obtiene partidos de un día y meses disponibles", () => {
    expect(getMatchesForDateKey(matches, "2026-03-14", TZ_AR)).toHaveLength(2);
    expect(getAvailableMonthKeys(matches, TZ_AR)).toEqual(["2026-03", "2026-04"]);
  });

  it("encuentra el próximo partido priorizando el vivo", () => {
    const live = makeMatch({
      id: "live",
      kickoffAt: "2026-03-20T11:40:00Z",
      period: "2H",
      score: { home: 1, away: 0 },
    });
    expect(getNextMatch([...matches, live], now)?.id).toBe("live");
    expect(getNextMatch(matches, now)?.id).toBe("b");
    expect(getNextMatch([], now)).toBeNull();
  });

  it("encuentra el último resultado finalizado", () => {
    expect(getLastResult(matches, now)?.id).toBe("d");
    expect(getLastResult([], now)).toBeNull();
  });

  it("lista próximos partidos programados", () => {
    expect(getUpcomingMatches(matches, now, 2).map((match) => match.id)).toEqual(["b"]);
  });

  it("cuenta estados", () => {
    expect(countMatchesByStatus(matches, now)).toMatchObject({
      scheduled: 1,
      finished: 2,
      postponed: 1,
    });
  });
});

describe("R-H2H — historial entre equipos", () => {
  it("agrega victorias, empates, derrotas y goles", () => {
    const now = "2026-12-31T12:00:00Z";
    const matches = [
      makeMatch({
        id: "h1",
        homeTeamId: RIVER_ID,
        awayTeamId: "boca",
        score: { home: 2, away: 1 },
        finishedAt: "2026-03-01T22:00:00Z",
      }),
      makeMatch({
        id: "h2",
        homeTeamId: "boca",
        awayTeamId: RIVER_ID,
        score: { home: 0, away: 0 },
        finishedAt: "2026-04-01T22:00:00Z",
      }),
      makeMatch({
        id: "h3",
        homeTeamId: RIVER_ID,
        awayTeamId: "boca",
        score: { home: 0, away: 2 },
        finishedAt: "2026-05-01T22:00:00Z",
      }),
      makeMatch({
        id: "other",
        homeTeamId: RIVER_ID,
        awayTeamId: "racing",
        score: { home: 5, away: 0 },
        finishedAt: "2026-05-02T22:00:00Z",
      }),
      makeMatch({
        id: "pending",
        homeTeamId: RIVER_ID,
        awayTeamId: "boca",
        kickoffAt: "2026-12-01T22:00:00Z",
      }),
    ];

    expect(computeHeadToHead(matches, RIVER_ID, "boca", now)).toEqual({
      played: 3,
      wins: 1,
      draws: 1,
      losses: 1,
      goalsFor: 2,
      goalsAgainst: 3,
    });
  });
});

describe("R-LINEUP — formación por equipo", () => {
  const lineups: Lineup[] = [
    {
      matchId: "match-1",
      teamId: "boca",
      formation: "4-4-2",
      coach: "DT rival",
      starters: [],
      bench: [],
    },
    {
      matchId: "match-1",
      teamId: RIVER_ID,
      formation: "4-3-1-2",
      coach: "",
      starters: [],
      bench: [],
    },
  ];

  it("encuentra la formación de River aunque esté como visitante", () => {
    expect(selectLineupForTeam(lineups, RIVER_ID)?.formation).toBe("4-3-1-2");
  });

  it("no atribuye la formación del rival a River cuando falta la propia", () => {
    const onlyOpponent = lineups.filter((lineup) => lineup.teamId !== RIVER_ID);
    expect(selectLineupForTeam(onlyOpponent, RIVER_ID)).toBeNull();
  });

  it("devuelve null sin formaciones publicadas", () => {
    expect(selectLineupForTeam(undefined, RIVER_ID)).toBeNull();
    expect(selectLineupForTeam([], RIVER_ID)).toBeNull();
  });
});
