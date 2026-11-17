import { describe, expect, it } from "vitest";
import eventDetail from "./__fixtures__/event-detail.json";
import eventsPayload from "./__fixtures__/events.json";
import incidentsPayload from "./__fixtures__/incidents.json";
import leagueLpf from "./__fixtures__/league-lpf.json";
import lineupsPayload from "./__fixtures__/lineups.json";
import playerStatsPayload from "./__fixtures__/player-stats.json";
import squadPayload from "./__fixtures__/squad.json";
import statsPayload from "./__fixtures__/stats.json";
import {
  buildSeason,
  mapCompetition,
  mapIncidents,
  mapLineups,
  mapMatch,
  mapPlayerStats,
  mapProviderStatus,
  mapSquad,
  mapStats,
  mapTeams,
  providerCompetitionId,
  providerMatchId,
  providerTeamId,
} from "./mappers";
import { bzzoiroEventSchema } from "./schemas";

const event = bzzoiroEventSchema.parse(eventDetail);
const upcoming = eventsPayload.results.find((row) => row.status === "notstarted")!;

describe("Bzzoiro — partidos", () => {
  it("mapea un partido finalizado con marcador, competición y equipos canónicos", () => {
    const match = mapMatch(event, { venueName: "La Bombonera", seasonId: "2026" });

    expect(match).toMatchObject({
      id: providerMatchId(223874),
      seasonId: "2026",
      competitionId: providerCompetitionId(85, 1635),
      round: "League phase · Matchday 15",
      venue: "La Bombonera",
      homeTeamId: providerTeamId(780),
      awayTeamId: "river",
      providerStatus: "finished",
    });
    expect(match.providerMinute).toBeUndefined();
    expect(match.kickoffAt).toBe("2026-11-01T18:00:00.000Z");
    expect(match.score).toEqual({ home: 1, away: 0, halftime: { home: 1, away: 0 } });
    expect(match.events).toEqual([]);
  });

  it("mapea un partido próximo sin marcador y usa la cancha canónica", () => {
    const match = mapMatch(upcoming);
    expect(match.id).toBe(providerMatchId(654311));
    expect(match.providerStatus).toBe("scheduled");
    expect(match.score).toBeUndefined();
    expect(match.venue).toBe("Estadio Más Monumental");
  });

  it("prioriza el estado del proveedor y usa el minuto informado en vivo", () => {
    const live = bzzoiroEventSchema.parse({
      ...upcoming,
      status: "inprogress",
      period: "2H",
      current_minute: 67,
      home_score: 1,
      away_score: 1,
    });
    const match = mapMatch(live);
    expect(match.providerStatus).toBe("live");
    expect(match.providerMinute).toBe(67);
    expect(match.period).toBe("2H");
    expect(match.score).toEqual({ home: 1, away: 1 });
  });

  it("marca entretiempo cuando el período es HT", () => {
    expect(mapProviderStatus({ ...upcoming, status: "inprogress", period: "HT" } as never)).toBe(
      "halftime",
    );
  });

  it("mapea los estados desconocidos a programado", () => {
    expect(mapProviderStatus({ ...upcoming, status: "raro" } as never)).toBe("scheduled");
  });
});

describe("Bzzoiro — competiciones y equipos", () => {
  it("mapea la Liga Profesional con su temporada actual", () => {
    const competition = mapCompetition(leagueLpf, 1635);
    expect(competition).toEqual({
      id: providerCompetitionId(85, 1635),
      slug: "liga-profesional",
      name: "Liga Profesional de Fútbol",
      shortName: "Liga Profesional",
      type: "league",
      seasonLabel: "2026",
    });
  });

  it("arma una temporada calendario con las competiciones detectadas", () => {
    const season = buildSeason(2026, ["bzzoiro:85-1635", "bzzoiro:33-114"]);
    expect(season).toMatchObject({
      id: "2026",
      label: "Temporada 2026",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      isActive: true,
    });
  });

  it("deriva equipos sin duplicados y con River canónico", () => {
    const teams = mapTeams(eventsPayload.results as never);
    const ids = teams.map((team) => team.id);
    expect(ids).toContain("river");
    expect(new Set(ids).size).toBe(ids.length);
    expect(teams.find((team) => team.id === "river")).toMatchObject({
      name: "River Plate",
      crest: "/brand/river-crest.svg",
    });
    expect(teams.find((team) => team.id === providerTeamId(785))?.name).toBe("CA Lanús");
  });
});

describe("Bzzoiro — incidencias", () => {
  const options = {
    matchId: providerMatchId(223874),
    homeTeamId: providerTeamId(780),
    awayTeamId: "river",
  };
  const mapped = mapIncidents(incidentsPayload.incidents as never, options);

  it("ignora períodos y descuentos, y mapea goles, tarjetas y cambios", () => {
    expect(mapped.some((event) => event.type === "var")).toBe(true);
    expect(mapped.some((event) => event.type === "goal")).toBe(true);
    expect(mapped.some((event) => event.type === "red")).toBe(true);
    expect(mapped.every((event) => !["period", "injuryTime"].includes(event.type as string))).toBe(
      true,
    );
  });

  it("respeta la convención de cambios: sale en playerId, entra en relatedPlayerId", () => {
    const sub = mapped.find((event) => event.type === "substitution");
    expect(sub).toMatchObject({
      minute: 88,
      playerId: "bzzoiro:16872",
      playerName: "L. Paredes",
      relatedPlayerId: "bzzoiro:22018",
      relatedPlayerName: "T. Belmonte",
    });
  });

  it("asigna el equipo según is_home y conserva nombres y asistencias", () => {
    const goal = mapped.find((event) => event.type === "goal");
    expect(goal).toMatchObject({
      teamId: providerTeamId(780),
      playerName: "L. D. Lollo",
      relatedPlayerName: "S. Villa",
    });
    const red = mapped.find((event) => event.type === "red");
    expect(red?.teamId).toBe("river");
    expect(red?.detail).toBe("Foul");
  });

  it("agrega el tiempo añadido como extraMinute", () => {
    const added = mapped.find((event) => event.extraMinute === 7);
    expect(added).toMatchObject({ minute: 90, type: "yellow", playerName: "A. Costa" });
  });
});

describe("Bzzoiro — estadísticas, formaciones y notas", () => {
  it("mapea las estadísticas comparativas", () => {
    const stats = mapStats(statsPayload as never);
    expect(stats?.home).toMatchObject({
      possession: 71,
      shots: 16,
      shotsOnTarget: 6,
      corners: 10,
      fouls: 17,
      offsides: 1,
      passes: 514,
    });
    expect(stats?.away.passAccuracy).toBe(66.7);
  });

  it("mapea ambas formaciones con titulares, suplentes y posiciones normalizadas", () => {
    const lineups = mapLineups(lineupsPayload as never, providerMatchId(223874));
    expect(lineups).toHaveLength(2);
    const river = lineups.find((lineup) => lineup.teamId === "river");
    expect(river).toMatchObject({ formation: "4-3-1-2" });
    expect(river?.starters).toHaveLength(11);
    expect(river?.bench).toHaveLength(12);
    expect(river?.starters[0]).toMatchObject({
      playerId: expect.stringMatching(/^bzzoiro:\d+$/),
      name: expect.any(String),
      position: expect.stringMatching(/^(GK|DF|MF|FW)$/),
      shirtNumber: expect.any(Number),
    });
  });

  it("devuelve formaciones vacías si el proveedor todavía no las publicó", () => {
    expect(mapLineups({ lineups: null } as never, "bzzoiro:event:1")).toEqual([]);
  });

  it("mapea notas reales y descarta jugadores sin minutos", () => {
    const stats = mapPlayerStats(playerStatsPayload.player_stats as never, providerMatchId(223874));
    expect(stats).toHaveLength(6);
    expect(stats[0]).toMatchObject({
      matchId: providerMatchId(223874),
      playerId: "bzzoiro:16869",
      minutes: 90,
      rating: 6.4,
      cards: { yellow: 1, red: 0 },
    });
    expect(stats.every((row) => row.minutes > 0)).toBe(true);
    expect(stats.every((row) => row.rating === null || (row.rating >= 1 && row.rating <= 10))).toBe(
      true,
    );
  });
});

describe("Bzzoiro — plantel", () => {
  it("normaliza el plantel real con disponibilidad y lesiones", () => {
    const squad = mapSquad(squadPayload as never, {
      seasonId: "2026",
      fetchedAt: "2026-11-13T10:00:00.000Z",
    });

    expect(squad.provider).toBe("bzzoiro");
    expect(squad.players.length).toBeGreaterThanOrEqual(30);
    expect(squad.players.every((player) => player.id.startsWith("bzzoiro:"))).toBe(true);
    expect(squad.players.map((player) => player.position)).toEqual(
      expect.arrayContaining(["GK", "DF", "MF", "FW"]),
    );

    const acuna = squad.players.find((player) => player.name === "Marcos Acuña");
    expect(acuna).toMatchObject({ availability: "available" });

    const ruberto = squad.players.find((player) => player.name === "Agustín Ruberto");
    expect(ruberto).toMatchObject({
      availability: "injured",
      injury: { type: "Cruciate Ligament Injury", expectedReturn: "2027-01-31" },
    });

    expect(squad.warnings.some((warning) => warning.code === "DUPLICATE_NUMBER")).toBe(true);
  });
});
