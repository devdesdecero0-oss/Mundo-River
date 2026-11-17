import type {
  Lineup,
  Match,
  MatchEvent,
  PlayerMatchStats,
  TeamMatchStats,
} from "@/domain/types";
import {
  addDaysToDateKey,
  parseDateKey,
  toLocalDateKey,
} from "@/domain/time";
import { deriveMatchStatus } from "@/domain/matches/status";
import { getCompetitionById, RIVER_TEAM_ID } from "./teams";
import {
  PLAYER_IDS,
  RIVER_LINEUP,
} from "./players";

type PlayerKey = keyof typeof PLAYER_IDS;

const AR_TZ = "America/Argentina/Buenos_Aires";
const NOW = new Date();
const DAY_MS = 86_400_000;

/** Instante para una fecha local argentina (UTC-3 todo el año). */
function artDate(offsetDays: number, hour: number, minute: number): string {
  const today = toLocalDateKey(NOW, AR_TZ);
  const key = addDaysToDateKey(today, offsetDays);
  const { year, month, day } = parseDateKey(key);
  return new Date(Date.UTC(year, month - 1, day, hour + 3, minute, 0)).toISOString();
}

function pid(key: PlayerKey): string {
  return PLAYER_IDS[key];
}

const PLAYER_KEY_BY_ID = new Map<string, PlayerKey>(
  Object.entries(PLAYER_IDS).map(([key, id]) => [id as string, key as PlayerKey]),
);

interface RiverGoal {
  minute: number;
  extraMinute?: number;
  type?: "goal" | "penalty_goal";
  scorer: PlayerKey;
  assist?: PlayerKey;
}

interface RivalGoal {
  minute: number;
  extraMinute?: number;
  type?: "goal" | "penalty_goal";
  scorer: string;
  assist?: string;
}

interface CardSpec {
  minute: number;
  team: "river" | "rival";
  type: "yellow" | "red" | "second_yellow";
  player?: PlayerKey;
  playerName?: string;
  detail?: string;
}

interface SubSpec {
  minute: number;
  out: PlayerKey;
  in: PlayerKey;
}

interface MatchSeed {
  id: string;
  competitionId: string;
  round: string;
  kickoffAt: string;
  venue: string;
  referee: string;
  broadcasters: string[];
  homeTeamId: string;
  awayTeamId: string;
  score?: { home: number; away: number; halftime?: { home: number; away: number }; penalties?: { home: number; away: number } };
  finishedAt?: string;
  period?: Match["period"];
  statusOverride?: Match["statusOverride"];
  statusReason?: string;
  isLive?: boolean;
  liveWindowMinutes?: number;
  stoppageFirstHalf?: number;
  stoppageSecondHalf?: number;
  attendance?: number;
  durationMinutes: number;
  stats: { home: TeamMatchStats; away: TeamMatchStats };
  riverGoals: RiverGoal[];
  rivalGoals: RivalGoal[];
  cards?: CardSpec[];
  subs?: SubSpec[];
  varEvent?: { minute: number; detail: string; team: "river" | "rival" };
  ratings?: Partial<Record<PlayerKey, number | null>>;
}

function teamStats(
  possession: number,
  shots: number,
  shotsOnTarget: number,
  corners: number,
  fouls: number,
  offsides: number,
  passes: number,
  passAccuracy: number,
): TeamMatchStats {
  return { possession, shots, shotsOnTarget, corners, fouls, offsides, passes, passAccuracy };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-");
}

function buildEvents(seed: MatchSeed): MatchEvent[] {
  let counter = 0;
  const nextId = () => `${seed.id}-e${++counter}`;
  const events: MatchEvent[] = [];

  for (const goal of seed.riverGoals) {
    events.push({
      id: nextId(),
      matchId: seed.id,
      minute: goal.minute,
      extraMinute: goal.extraMinute,
      type: goal.type ?? "goal",
      teamId: RIVER_TEAM_ID,
      playerId: pid(goal.scorer),
      relatedPlayerId: goal.assist ? pid(goal.assist) : undefined,
    });
  }

  for (const goal of seed.rivalGoals) {
    events.push({
      id: nextId(),
      matchId: seed.id,
      minute: goal.minute,
      extraMinute: goal.extraMinute,
      type: goal.type ?? "goal",
      teamId: seed.awayTeamId === RIVER_TEAM_ID ? seed.homeTeamId : seed.awayTeamId,
      playerId: `${seed.awayTeamId === RIVER_TEAM_ID ? seed.homeTeamId : seed.awayTeamId}:${slugify(goal.scorer)}`,
      relatedPlayerId: goal.assist ? `${seed.awayTeamId}:${slugify(goal.assist)}` : undefined,
      detail: goal.scorer,
    });
  }

  for (const card of seed.cards ?? []) {
    const teamId = card.team === "river" ? RIVER_TEAM_ID : seed.awayTeamId === RIVER_TEAM_ID ? seed.homeTeamId : seed.awayTeamId;
    events.push({
      id: nextId(),
      matchId: seed.id,
      minute: card.minute,
      type: card.type,
      teamId,
      playerId: card.player
        ? pid(card.player)
        : `${teamId}:${slugify(card.playerName ?? "jugador")}`,
      detail: card.detail ?? card.playerName,
    });
  }

  for (const sub of seed.subs ?? []) {
    events.push({
      id: nextId(),
      matchId: seed.id,
      minute: sub.minute,
      type: "substitution",
      teamId: RIVER_TEAM_ID,
      playerId: pid(sub.out),
      relatedPlayerId: pid(sub.in),
    });
  }

  if (seed.varEvent) {
    const teamId =
      seed.varEvent.team === "river"
        ? RIVER_TEAM_ID
        : seed.awayTeamId === RIVER_TEAM_ID
          ? seed.homeTeamId
          : seed.awayTeamId;
    events.push({
      id: nextId(),
      matchId: seed.id,
      minute: seed.varEvent.minute,
      type: "var",
      teamId,
      playerId: RIVER_TEAM_ID,
      detail: seed.varEvent.detail,
    });
  }

  return events.sort(
    (a, b) =>
      a.minute - b.minute ||
      (a.extraMinute ?? 0) - (b.extraMinute ?? 0) ||
      a.id.localeCompare(b.id),
  );
}

function hash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0;
  }
  return result;
}

function buildPlayerStats(seed: MatchSeed, events: MatchEvent[]): PlayerMatchStats[] {
  const minutes = new Map<string, number>();
  for (const starter of RIVER_LINEUP.starters) {
    minutes.set(starter.playerId, seed.durationMinutes);
  }
  for (const player of RIVER_LINEUP.bench) {
    minutes.set(player, 0);
  }

  for (const sub of seed.subs ?? []) {
    minutes.set(pid(sub.out), Math.min(sub.minute, seed.durationMinutes));
    minutes.set(pid(sub.in), Math.max(0, seed.durationMinutes - sub.minute));
  }

  return [...minutes.entries()]
    .filter(([, played]) => played > 0)
    .map(([playerId, played]) => {
      const key = PLAYER_KEY_BY_ID.get(playerId);
      const ratingOverride = key ? seed.ratings?.[key] : undefined;
      const goals = seed.riverGoals.filter(
        (goal) => pid(goal.scorer) === playerId,
      ).length;
      const assists = seed.riverGoals.filter(
        (goal) => goal.assist !== undefined && pid(goal.assist) === playerId,
      ).length;
      const playerEvents = events.filter(
        (event) => event.playerId === playerId && event.teamId === RIVER_TEAM_ID,
      );
      const yellow = playerEvents.filter(
        (event) => event.type === "yellow" || event.type === "second_yellow",
      ).length;
      const red = playerEvents.filter(
        (event) => event.type === "red" || event.type === "second_yellow",
      ).length;
      const shots = goals * 2 + (hash(`${seed.id}:${playerId}`) % 3) + 1;

      return {
        matchId: seed.id,
        playerId,
        minutes: played,
        rating:
          ratingOverride === null
            ? null
            : ratingOverride ?? Math.round((6.2 + (hash(`${playerId}:${seed.id}`) % 10) / 10) * 10) / 10,
        goals,
        assists,
        shots,
        shotsOnTarget: Math.min(shots, goals + 1),
        cards: { yellow, red },
      };
    });
}

function buildLineup(matchId: string): Lineup {
  return {
    matchId,
    teamId: RIVER_TEAM_ID,
    formation: RIVER_LINEUP.formation,
    coach: RIVER_LINEUP.coach,
    starters: RIVER_LINEUP.starters.map((starter) => ({ ...starter })),
    bench: [...RIVER_LINEUP.bench],
  };
}

function finishedAt(seed: Pick<MatchSeed, "kickoffAt" | "durationMinutes">): string {
  return new Date(new Date(seed.kickoffAt).getTime() + seed.durationMinutes * 60_000).toISOString();
}

function toMatch(seed: MatchSeed): Match {
  const events = buildEvents(seed);
  return {
    id: seed.id,
    seasonId: "2026",
    competitionId: seed.competitionId,
    round: seed.round,
    kickoffAt: seed.kickoffAt,
    venue: seed.venue,
    referee: seed.referee,
    broadcasters: seed.broadcasters,
    homeTeamId: seed.homeTeamId,
    awayTeamId: seed.awayTeamId,
    statusOverride: seed.statusOverride,
    statusReason: seed.statusReason,
    period: seed.period,
    score: seed.score,
    finishedAt: seed.finishedAt,
    liveWindowMinutes: seed.liveWindowMinutes,
    stoppageFirstHalf: seed.stoppageFirstHalf,
    stoppageSecondHalf: seed.stoppageSecondHalf,
    attendance: seed.attendance,
    stats: seed.stats,
    lineups: [buildLineup(seed.id)],
    events,
  };
}

const seeds: MatchSeed[] = [
  {
    id: "vs-boca-liga",
    competitionId: "liga-2026",
    round: "Fecha 17",
    kickoffAt: artDate(-3, 21, 30),
    venue: "Más Monumental",
    referee: "Darío Herrera",
    broadcasters: ["ESPN Premium", "Telefe"],
    homeTeamId: RIVER_TEAM_ID,
    awayTeamId: "boca",
    score: { home: 2, away: 1, halftime: { home: 1, away: 0 } },
    durationMinutes: 90,
    attendance: 84_567,
    stats: {
      home: teamStats(58, 15, 7, 6, 12, 2, 512, 86),
      away: teamStats(42, 9, 3, 3, 14, 4, 371, 79),
    },
    riverGoals: [
      { minute: 23, scorer: "driussi", assist: "mastantuono" },
      { minute: 67, scorer: "borja", assist: "colidio" },
    ],
    rivalGoals: [{ minute: 80, scorer: "Miguel Merentiel", assist: "Exequiel Zeballos" }],
    cards: [
      { minute: 35, team: "river", type: "yellow", player: "simon" },
      { minute: 44, team: "rival", type: "yellow", playerName: "Marcos Rojo" },
      { minute: 58, team: "river", type: "yellow", player: "pezzella" },
    ],
    subs: [
      { minute: 70, out: "colidio", in: "subiabre" },
      { minute: 78, out: "borja", in: "ruberto" },
      { minute: 84, out: "mastantuono", in: "galoppo" },
    ],
    ratings: {
      armani: 7.2,
      montiel: 6.8,
      pezzella: 6.9,
      martinezQuarta: 7.1,
      acuna: 7.0,
      simon: 7.0,
      ignacioFernandez: 7.3,
      mastantuono: 8.0,
      colidio: 7.4,
      driussi: 8.1,
      borja: 7.6,
      subiabre: 6.7,
      ruberto: 6.8,
      galoppo: 6.5,
    },
  },
  {
    id: "vs-racing-liga",
    competitionId: "liga-2026",
    round: "Fecha 16",
    kickoffAt: artDate(-10, 19, 15),
    venue: "El Cilindro",
    referee: "Facundo Tello",
    broadcasters: ["TNT Sports"],
    homeTeamId: "racing",
    awayTeamId: RIVER_TEAM_ID,
    score: { home: 0, away: 1, halftime: { home: 0, away: 0 } },
    durationMinutes: 90,
    attendance: 51_200,
    stats: {
      home: teamStats(49, 11, 3, 4, 13, 1, 418, 81),
      away: teamStats(51, 12, 5, 5, 10, 2, 455, 83),
    },
    riverGoals: [{ minute: 55, scorer: "driussi", assist: "ignacioFernandez" }],
    rivalGoals: [],
    cards: [
      { minute: 38, team: "river", type: "yellow", player: "simon" },
      { minute: 74, team: "rival", type: "yellow", playerName: "Agustín Almendra" },
    ],
    subs: [
      { minute: 65, out: "borja", in: "ruberto" },
      { minute: 80, out: "colidio", in: "subiabre" },
    ],
    ratings: {
      armani: 7.8,
      montiel: 7.2,
      pezzella: 7.4,
      "martinezQuarta": 7.3,
      acuna: 7.1,
      simon: 7.0,
      ignacioFernandez: 7.6,
      mastantuono: 7.4,
      colidio: 5.9,
      driussi: 8.4,
      borja: 6.5,
      ruberto: 6.6,
      subiabre: 6.4,
    },
  },
  {
    id: "vs-flamengo-libertadores",
    competitionId: "libertadores-2026",
    round: "Semifinal · Ida",
    kickoffAt: artDate(-17, 21, 0),
    venue: "Más Monumental",
    referee: "Wilton Sampaio",
    broadcasters: ["Fox Sports", "Disney+"],
    homeTeamId: RIVER_TEAM_ID,
    awayTeamId: "flamengo",
    score: { home: 2, away: 2, halftime: { home: 1, away: 1 } },
    durationMinutes: 90,
    attendance: 83_100,
    stats: {
      home: teamStats(47, 13, 6, 5, 15, 3, 438, 82),
      away: teamStats(53, 14, 5, 7, 12, 1, 501, 87),
    },
    riverGoals: [
      { minute: 12, scorer: "driussi", assist: "mastantuono" },
      { minute: 74, scorer: "mastantuono", assist: "ignacioFernandez" },
    ],
    rivalGoals: [
      { minute: 30, scorer: "Pedro", assist: "Giorgian de Arrascaeta" },
      { minute: 88, scorer: "Giorgian de Arrascaeta", assist: "Nicolás de la Cruz" },
    ],
    cards: [
      { minute: 40, team: "river", type: "yellow", player: "ignacioFernandez" },
      { minute: 62, team: "rival", type: "yellow", playerName: "Erick Pulgar" },
    ],
    subs: [{ minute: 70, out: "borja", in: "subiabre" }],
    varEvent: { minute: 84, team: "rival", detail: "VAR: gol anulado por fuera de juego" },
    ratings: {
      armani: 6.8,
      montiel: 7.0,
      pezzella: 6.9,
      "martinezQuarta": 7.3,
      acuna: 6.7,
      simon: 6.8,
      ignacioFernandez: 7.9,
      mastantuono: 8.6,
      colidio: 7.2,
      driussi: 7.9,
      borja: 6.4,
      subiabre: 6.8,
    },
  },
  {
    id: "vs-talleres-copa",
    competitionId: "copa-argentina-2026",
    round: "Cuartos de final",
    kickoffAt: artDate(-24, 20, 10),
    venue: "Estadio Mario Alberto Kempes",
    referee: "Pablo Echavarría",
    broadcasters: ["TyC Sports"],
    homeTeamId: RIVER_TEAM_ID,
    awayTeamId: "talleres",
    score: { home: 3, away: 0, halftime: { home: 2, away: 0 } },
    durationMinutes: 90,
    attendance: 57_000,
    stats: {
      home: teamStats(61, 18, 10, 8, 9, 1, 546, 88),
      away: teamStats(39, 7, 2, 2, 16, 3, 345, 76),
    },
    riverGoals: [
      { minute: 9, scorer: "borja", assist: "colidio" },
      { minute: 41, scorer: "colidio", assist: "mastantuono" },
      { minute: 85, scorer: "subiabre", assist: "ignacioFernandez" },
    ],
    rivalGoals: [],
    cards: [{ minute: 55, team: "rival", type: "yellow", playerName: "Juan Portillo" }],
    subs: [
      { minute: 60, out: "borja", in: "subiabre" },
      { minute: 72, out: "mastantuono", in: "galoppo" },
    ],
    ratings: {
      armani: 7.0,
      montiel: 7.5,
      pezzella: 7.6,
      "martinezQuarta": 7.4,
      acuna: 7.3,
      simon: 7.1,
      ignacioFernandez: 8.0,
      mastantuono: 7.9,
      colidio: 8.2,
      driussi: 6.8,
      borja: 7.9,
      subiabre: 7.5,
      galoppo: 6.6,
    },
  },
  {
    id: "vs-independiente-liga",
    competitionId: "liga-2026",
    round: "Fecha 15",
    kickoffAt: artDate(-31, 18, 45),
    venue: "Libertadores de América",
    referee: "Andrés Merlos",
    broadcasters: ["ESPN Premium"],
    homeTeamId: "independiente",
    awayTeamId: RIVER_TEAM_ID,
    score: { home: 1, away: 0, halftime: { home: 1, away: 0 } },
    durationMinutes: 90,
    stats: {
      home: teamStats(44, 10, 4, 4, 17, 2, 365, 78),
      away: teamStats(56, 13, 3, 6, 12, 4, 498, 85),
    },
    riverGoals: [],
    rivalGoals: [{ minute: 63, scorer: "Gabriel Ávalos", assist: "Lucas Román" }],
    cards: [
      { minute: 30, team: "river", type: "yellow", player: "martinezQuarta" },
      { minute: 52, team: "river", type: "yellow", player: "aliendro" },
      { minute: 81, team: "rival", type: "yellow", playerName: "Iván Marcone" },
    ],
    ratings: {
      armani: 6.9,
      montiel: 6.2,
      pezzella: 6.4,
      "martinezQuarta": 5.8,
      acuna: 6.1,
      simon: 5.9,
      ignacioFernandez: 6.6,
      mastantuono: 6.0,
      colidio: 5.7,
      driussi: 6.3,
      borja: 5.6,
    },
  },
  {
    id: "vs-palmeiras-libertadores",
    competitionId: "libertadores-2026",
    round: "Cuartos de final · Vuelta",
    kickoffAt: artDate(-38, 21, 30),
    venue: "Allianz Parque",
    referee: "Piero Maza",
    broadcasters: ["Fox Sports"],
    homeTeamId: "palmeiras",
    awayTeamId: RIVER_TEAM_ID,
    score: { home: 0, away: 1, halftime: { home: 0, away: 1 } },
    durationMinutes: 90,
    attendance: 41_000,
    stats: {
      home: teamStats(57, 16, 5, 8, 14, 1, 522, 85),
      away: teamStats(43, 9, 4, 3, 16, 3, 388, 79),
    },
    riverGoals: [{ minute: 38, scorer: "driussi", assist: "ignacioFernandez" }],
    rivalGoals: [],
    cards: [
      { minute: 70, team: "river", type: "yellow", player: "simon" },
      { minute: 85, team: "river", type: "yellow", player: "pezzella" },
    ],
    subs: [{ minute: 75, out: "borja", in: "ruberto" }],
    ratings: {
      armani: 8.5,
      montiel: 7.6,
      pezzella: 8.1,
      "martinezQuarta": 7.9,
      acuna: 7.4,
      simon: 7.0,
      ignacioFernandez: 7.2,
      mastantuono: 7.1,
      colidio: 6.6,
      driussi: 8.0,
      borja: 6.3,
      ruberto: 6.5,
    },
  },
  {
    id: "vs-san-lorenzo-liga",
    competitionId: "liga-2026",
    round: "Fecha 14",
    kickoffAt: artDate(-45, 21, 0),
    venue: "Más Monumental",
    referee: "Nicolás Ramírez",
    broadcasters: ["TNT Sports"],
    homeTeamId: RIVER_TEAM_ID,
    awayTeamId: "san-lorenzo",
    score: { home: 2, away: 0, halftime: { home: 1, away: 0 } },
    durationMinutes: 90,
    attendance: 80_200,
    stats: {
      home: teamStats(63, 17, 8, 7, 10, 2, 567, 89),
      away: teamStats(37, 6, 2, 2, 18, 3, 322, 73),
    },
    riverGoals: [
      { minute: 5, type: "penalty_goal", scorer: "driussi" },
      { minute: 60, scorer: "mastantuono", assist: "simon" },
    ],
    rivalGoals: [],
    cards: [{ minute: 69, team: "rival", type: "yellow", playerName: "Jhohan Romaña" }],
    subs: [
      { minute: 68, out: "colidio", in: "subiabre" },
      { minute: 80, out: "driussi", in: "ruberto" },
    ],
    ratings: {
      armani: 7.4,
      montiel: 7.2,
      pezzella: 7.5,
      "martinezQuarta": 7.3,
      acuna: 7.0,
      simon: 7.7,
      ignacioFernandez: 7.6,
      mastantuono: 8.3,
      colidio: 7.1,
      driussi: 8.0,
      borja: 6.7,
      subiabre: 6.8,
      ruberto: 6.5,
    },
  },
  {
    id: "vs-velez-liga",
    competitionId: "liga-2026",
    round: "Fecha 13",
    kickoffAt: artDate(-52, 17, 30),
    venue: "Más Monumental",
    referee: "Sebastián Zunino",
    broadcasters: ["ESPN Premium"],
    homeTeamId: RIVER_TEAM_ID,
    awayTeamId: "velez",
    score: { home: 1, away: 1, halftime: { home: 1, away: 0 } },
    durationMinutes: 90,
    attendance: 78_300,
    stats: {
      home: teamStats(59, 14, 5, 8, 11, 1, 531, 87),
      away: teamStats(41, 8, 3, 3, 15, 2, 358, 77),
    },
    riverGoals: [{ minute: 33, scorer: "ignacioFernandez", assist: "driussi" }],
    rivalGoals: [{ minute: 70, scorer: "Thiago Fernández", assist: "Claudio Aquino" }],
    cards: [{ minute: 62, team: "river", type: "yellow", player: "pezzella" }],
    subs: [{ minute: 85, out: "simon", in: "galoppo" }],
    ratings: {
      armani: 6.7,
      montiel: 6.9,
      pezzella: 6.3,
      "martinezQuarta": 6.8,
      acuna: 7.0,
      simon: 6.6,
      ignacioFernandez: 7.8,
      mastantuono: 7.2,
      colidio: 6.5,
      driussi: 6.9,
      borja: 6.1,
      galoppo: null,
    },
  },
  {
    id: "vs-estudiantes-liga",
    competitionId: "liga-2026",
    round: "Fecha 18",
    kickoffAt: new Date(NOW.getTime() - 83 * 60_000).toISOString(),
    venue: "Más Monumental",
    referee: "Hernán Mastrángelo",
    broadcasters: ["TNT Sports", "Telefe"],
    homeTeamId: RIVER_TEAM_ID,
    awayTeamId: "estudiantes",
    score: { home: 2, away: 1, halftime: { home: 2, away: 1 } },
    period: "2H",
    stoppageSecondHalf: 3,
    isLive: true,
    durationMinutes: 68,
    attendance: 82_450,
    stats: {
      home: teamStats(56, 12, 6, 5, 9, 2, 412, 85),
      away: teamStats(44, 8, 4, 3, 12, 1, 321, 80),
    },
    riverGoals: [
      { minute: 18, type: "penalty_goal", scorer: "driussi" },
      { minute: 41, scorer: "colidio", assist: "mastantuono" },
    ],
    rivalGoals: [{ minute: 52, scorer: "Alan Carrillo", assist: "Santiago Ascacíbar" }],
    cards: [
      { minute: 25, team: "river", type: "yellow", player: "pezzella" },
      { minute: 57, team: "rival", type: "yellow", playerName: "Gastón Benedetti" },
    ],
    subs: [{ minute: 55, out: "borja", in: "subiabre" }],
    ratings: {
      armani: 7.3,
      montiel: 7.0,
      pezzella: 6.4,
      martinezQuarta: 7.1,
      acuna: 7.2,
      simon: 6.9,
      ignacioFernandez: 7.4,
      mastantuono: 8.2,
      colidio: 7.8,
      driussi: 7.9,
      borja: 6.5,
      subiabre: 6.7,
    },
  },
  {
    id: "vs-rosario-central-liga",
    competitionId: "liga-2026",
    round: "Fecha 19",
    kickoffAt: artDate(4, 21, 30),
    venue: "Más Monumental",
    referee: "Yael Falcón Pérez",
    broadcasters: ["ESPN Premium"],
    homeTeamId: RIVER_TEAM_ID,
    awayTeamId: "rosario-central",
    durationMinutes: 90,
    stats: {
      home: teamStats(55, 0, 0, 0, 0, 0, 0, 0),
      away: teamStats(45, 0, 0, 0, 0, 0, 0, 0),
    },
    riverGoals: [],
    rivalGoals: [],
  },
  {
    id: "vs-nacional-libertadores",
    competitionId: "libertadores-2026",
    round: "Final · Ida",
    kickoffAt: artDate(11, 21, 0),
    venue: "Gran Parque Central",
    referee: "Andrés Rojas",
    broadcasters: ["Fox Sports", "Disney+"],
    homeTeamId: "nacional",
    awayTeamId: RIVER_TEAM_ID,
    durationMinutes: 90,
    stats: {
      home: teamStats(48, 0, 0, 0, 0, 0, 0, 0),
      away: teamStats(52, 0, 0, 0, 0, 0, 0, 0),
    },
    riverGoals: [],
    rivalGoals: [],
  },
  {
    id: "vs-huracan-liga",
    competitionId: "liga-2026",
    round: "Fecha 20",
    kickoffAt: artDate(18, 19, 15),
    venue: "Estadio Tomás A. Ducó",
    referee: "Leandro Rey Hilfer",
    broadcasters: ["TNT Sports"],
    homeTeamId: "huracan",
    awayTeamId: RIVER_TEAM_ID,
    durationMinutes: 90,
    stats: {
      home: teamStats(50, 0, 0, 0, 0, 0, 0, 0),
      away: teamStats(50, 0, 0, 0, 0, 0, 0, 0),
    },
    riverGoals: [],
    rivalGoals: [],
  },
  {
    id: "vs-gimnasia-liga",
    competitionId: "liga-2026",
    round: "Fecha 21",
    kickoffAt: artDate(25, 21, 30),
    venue: "Más Monumental",
    referee: "A confirmar",
    broadcasters: ["ESPN Premium"],
    homeTeamId: RIVER_TEAM_ID,
    awayTeamId: "gimnasia",
    statusOverride: "postponed",
    statusReason: "Reprogramado por la organización del torneo.",
    durationMinutes: 90,
    stats: {
      home: teamStats(50, 0, 0, 0, 0, 0, 0, 0),
      away: teamStats(50, 0, 0, 0, 0, 0, 0, 0),
    },
    riverGoals: [],
    rivalGoals: [],
  },
  {
    id: "vs-velez-trofeo",
    competitionId: "trofeo-campeones-2026",
    round: "Final",
    kickoffAt: artDate(32, 21, 0),
    venue: "Estadio Único de Santiago del Estero",
    referee: "A confirmar",
    broadcasters: ["TyC Sports", "Telefe"],
    homeTeamId: RIVER_TEAM_ID,
    awayTeamId: "velez",
    durationMinutes: 90,
    stats: {
      home: teamStats(50, 0, 0, 0, 0, 0, 0, 0),
      away: teamStats(50, 0, 0, 0, 0, 0, 0, 0),
    },
    riverGoals: [],
    rivalGoals: [],
  },
];

export const MATCHES: Match[] = seeds.map((seed) => {
  const withFinished =
    seed.score !== undefined &&
    !seed.isLive &&
    seed.statusOverride !== "postponed"
      ? { ...seed, finishedAt: seed.finishedAt ?? finishedAt(seed) }
      : seed;
  return toMatch(withFinished as MatchSeed);
});

/** Temporadas relativas del demo: se recalculan en cada arranque del servidor. */
export const DEMO_TIMELINE = {
  now: NOW.toISOString(),
  dayMs: DAY_MS,
  liveMatchId: "vs-estudiantes-liga",
} as const;

export function getMatchById(id: string): Match | null {
  return MATCHES.find((match) => match.id === id) ?? null;
}

export function getMatchStats(matchId: string): PlayerMatchStats[] {
  const seed = seeds.find((candidate) => candidate.id === matchId);
  if (!seed) return [];

  // Un partido que todavía no se jugó no tiene minutos ni calificaciones.
  const match = getMatchById(matchId);
  if (!match) return [];
  const status = deriveMatchStatus(match, NOW);
  if (
    status === "scheduled" ||
    status === "postponed" ||
    status === "suspended" ||
    status === "cancelled"
  ) {
    return [];
  }

  return buildPlayerStats(seed, buildEvents(seed));
}

export function getCompetitionForMatch(match: Match) {
  return getCompetitionById(match.competitionId);
}

export type { MatchSeed };
