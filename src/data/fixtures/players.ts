import { normalizeSquadPayload } from "@/domain/squad";
import type { Player } from "@/domain/types";
import { RAW_SQUAD_PAYLOAD } from "./squad";

export const SQUAD_SNAPSHOT = normalizeSquadPayload(RAW_SQUAD_PAYLOAD, "river", {
  teamId: "river",
  seasonId: "2026",
  from: "2026-01-01",
});

export const PLAYERS: Player[] = SQUAD_SNAPSHOT.players;

const byKey = new Map(PLAYERS.map((player) => [player.providerRef?.externalId ?? player.id, player]));
const byId = new Map(PLAYERS.map((player) => [player.id, player]));

export const PLAYER_IDS = {
  armani: "river:armani",
  ledesma: "river:ledesma",
  beltran: "river:beltran",
  montiel: "river:montiel",
  bustos: "river:bustos",
  pezzella: "river:pezzella",
  martinezQuarta: "river:martinez-quarta",
  pauloDiaz: "river:paulo-diaz",
  acuna: "river:acuna",
  enzoDiaz: "river:enzo-diaz",
  casco: "river:casco",
  ignacioFernandez: "river:ignacio-fernandez",
  simon: "river:simon",
  aliendro: "river:aliendro",
  castano: "river:castano",
  mastantuono: "river:mastantuono",
  galoppo: "river:galoppo",
  kranevitter: "river:kranevitter",
  driussi: "river:driussi",
  borja: "river:borja",
  colidio: "river:colidio",
  subiabre: "river:subiabre",
  ruberto: "river:ruberto",
  lencina: "river:lencina",
} as const;

export function getPlayerById(id: string): Player | null {
  return byId.get(id) ?? null;
}

export function getPlayerByKey(key: string): Player | null {
  return byKey.get(key) ?? null;
}

export function playerId(key: keyof typeof PLAYER_IDS): string {
  return PLAYER_IDS[key];
}

export function playerName(key: keyof typeof PLAYER_IDS): string {
  return getPlayerByKey(key)?.name ?? "Jugador desconocido";
}

export const RIVER_LINEUP = {
  formation: "4-3-3",
  coach: "Marcelo Gallardo",
  starters: [
    { playerId: PLAYER_IDS.armani, position: "GK", shirtNumber: 1 },
    { playerId: PLAYER_IDS.montiel, position: "RB", shirtNumber: 4 },
    { playerId: PLAYER_IDS.pezzella, position: "CB", shirtNumber: 6 },
    { playerId: PLAYER_IDS.martinezQuarta, position: "CB", shirtNumber: 28 },
    { playerId: PLAYER_IDS.acuna, position: "LB", shirtNumber: 21 },
    { playerId: PLAYER_IDS.simon, position: "CM", shirtNumber: 8 },
    { playerId: PLAYER_IDS.ignacioFernandez, position: "CM", shirtNumber: 10 },
    { playerId: PLAYER_IDS.mastantuono, position: "CM", shirtNumber: 30 },
    { playerId: PLAYER_IDS.colidio, position: "RW", shirtNumber: 19 },
    { playerId: PLAYER_IDS.driussi, position: "ST", shirtNumber: 9 },
    { playerId: PLAYER_IDS.borja, position: "LW", shirtNumber: 7 },
  ],
  bench: [
    PLAYER_IDS.ledesma,
    PLAYER_IDS.bustos,
    PLAYER_IDS.pauloDiaz,
    PLAYER_IDS.enzoDiaz,
    PLAYER_IDS.aliendro,
    PLAYER_IDS.castano,
    PLAYER_IDS.galoppo,
    PLAYER_IDS.kranevitter,
    PLAYER_IDS.subiabre,
    PLAYER_IDS.ruberto,
    PLAYER_IDS.lencina,
  ],
} as const;
