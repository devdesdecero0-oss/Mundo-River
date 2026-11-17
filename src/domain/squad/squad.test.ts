import { describe, expect, it } from "vitest";
import {
  computeSquadChecksum,
  mapProviderPlayer,
  normalizeSquadPayload,
  resolveSquadPlayer,
  unknownPlayer,
  validateSquad,
} from "@/domain/squad";
import type { RawSquadPayload, SquadSnapshot } from "@/domain/types";

const provider = "test-provider";

const raw: RawSquadPayload = {
  provider,
  fetchedAt: "2026-01-15T10:00:00.000Z",
  players: [
    { id: 1, name: "Franco Armani", position: "GK", shirtNumber: 1, nationality: "Argentina", updatedAt: "2026-01-01" },
    { id: 2, name: "Paulo Díaz", position: "DEF", shirtNumber: 17, nationality: "Chile", updatedAt: "2026-01-02" },
    { id: 3, name: "Ignacio Fernández", position: "MED", shirtNumber: 10, nationality: "Argentina", updatedAt: "2026-01-03", isCaptain: true },
    { id: 4, name: "Sebastián Driussi", position: "DEL", shirtNumber: 9, nationality: "Argentina", updatedAt: "2026-01-04" },
  ],
};

describe("R-SQUAD — normalización de jugadores", () => {
  it("genera un ID canónico determinista y normaliza posición y dorsal", () => {
    const player = mapProviderPlayer(
      { id: 123, name: "  Enzo Pérez  ", position: "med", shirtNumber: "5", nationality: "Argentina" },
      "api-football",
    );
    expect(player).toMatchObject({
      id: "api-football:123",
      name: "Enzo Pérez",
      displayName: "Enzo Pérez",
      shirtNumber: 5,
      position: "MF",
      nationality: "Argentina",
    });
    expect(player?.providerRef).toMatchObject({ provider: "api-football", externalId: "123" });
  });

  it("mapea todos los alias de posición", () => {
    const aliases: Array<[string, string]> = [
      ["POR", "GK"],
      ["goalkeeper", "GK"],
      ["DF", "DF"],
      ["defender", "DF"],
      ["MF", "MF"],
      ["mediocampista", "MF"],
      ["FW", "FW"],
      ["delantero", "FW"],
    ];
    for (const [input, expected] of aliases) {
      expect(mapProviderPlayer({ id: 9, name: "Jugador", position: input }, provider)?.position).toBe(
        expected,
      );
    }
  });

  it("omite jugadores con datos obligatorios faltantes (caso borde 14)", () => {
    expect(mapProviderPlayer({ id: 1, position: "GK" }, provider)).toBeNull();
    expect(mapProviderPlayer({ name: "Sin ID", position: "GK" }, provider)).toBeNull();
    expect(mapProviderPlayer({ id: 1, name: "Sin posición" }, provider)).toBeNull();
    expect(mapProviderPlayer({ id: 1, name: "Rara", position: "XYZ" }, provider)).toBeNull();
  });

  it("convierte dorsales inválidos en 0 (sin dorsal)", () => {
    expect(mapProviderPlayer({ id: 1, name: "A", position: "GK", shirtNumber: 150 }, provider)?.shirtNumber).toBe(0);
    expect(mapProviderPlayer({ id: 1, name: "A", position: "GK", shirtNumber: "abc" }, provider)?.shirtNumber).toBe(0);
    expect(mapProviderPlayer({ id: 1, name: "A", position: "GK", shirtNumber: 99 }, provider)?.shirtNumber).toBe(99);
  });

  it("solo acepta contractUntil con formato AAAA-MM-DD", () => {
    expect(mapProviderPlayer({ id: 1, name: "A", position: "GK", contractUntil: "2027-12-31" }, provider)?.contractUntil).toBe("2027-12-31");
    expect(mapProviderPlayer({ id: 1, name: "A", position: "GK", contractUntil: "31/12/2027" }, provider)?.contractUntil).toBeUndefined();
  });

  it("acepta las abreviaturas del proveedor G/D/M/F", () => {
    expect(mapProviderPlayer({ id: 1, name: "A", position: "G" }, provider)?.position).toBe("GK");
    expect(mapProviderPlayer({ id: 2, name: "B", position: "D" }, provider)?.position).toBe("DF");
    expect(mapProviderPlayer({ id: 3, name: "C", position: "M" }, provider)?.position).toBe("MF");
    expect(mapProviderPlayer({ id: 4, name: "D", position: "F" }, provider)?.position).toBe("FW");
  });

  it("normaliza disponibilidad y lesión provistas por el proveedor", () => {
    const injured = mapProviderPlayer(
      {
        id: 240,
        name: "Adam Bareiro",
        position: "F",
        availability: "injured",
        injuryType: "Back Injury",
        injuryExpectedReturn: "2026-12-01",
      },
      provider,
    );
    expect(injured?.availability).toBe("injured");
    expect(injured?.injury).toEqual({ type: "Back Injury", expectedReturn: "2026-12-01" });

    const available = mapProviderPlayer(
      { id: 1, name: "Franco Armani", position: "G", availability: "available", injuryType: "" },
      provider,
    );
    expect(available?.availability).toBe("available");
    expect(available?.injury).toBeUndefined();
  });

  it("marca disponibilidad desconocida sin romper el jugador", () => {
    expect(mapProviderPlayer({ id: 1, name: "A", position: "GK" }, provider)?.availability).toBeUndefined();
    expect(
      mapProviderPlayer({ id: 2, name: "B", position: "GK", availability: "sin-dato" }, provider)
        ?.availability,
    ).toBe("unknown");
  });
});

describe("R-SQUAD — snapshot normalizado", () => {
  it("normaliza la plantilla completa y ordena por posición y dorsal", () => {
    const squad = normalizeSquadPayload(raw, provider);
    expect(squad.players.map((player) => player.id)).toEqual([
      "test-provider:1",
      "test-provider:2",
      "test-provider:3",
      "test-provider:4",
    ]);
    expect(squad.players.map((player) => player.position)).toEqual(["GK", "DF", "MF", "FW"]);
    expect(squad.memberships).toHaveLength(4);
    expect(squad.fetchedAt).toBe(raw.fetchedAt);
    expect(squad.warnings).toEqual([]);
    expect(squad.checksum).toMatch(/^[0-9a-f]{8}$/);
  });

  it("es idempotente: dos normalizaciones del mismo payload son iguales", () => {
    const first = normalizeSquadPayload(raw, provider);
    const second = normalizeSquadPayload(raw, provider);
    expect(second).toEqual(first);
    expect(second.checksum).toBe(first.checksum);
    expect(computeSquadChecksum(first.players)).toBe(first.checksum);
  });

  it("omite un jugador sin posición y conserva el resto válido (caso borde 14)", () => {
    const squad = normalizeSquadPayload(
      {
        ...raw,
        players: [
          ...raw.players!,
          { id: 5, name: "Sin Posición", position: "XYZ" },
          { id: 6, name: "", position: "GK" },
        ],
      },
      provider,
    );
    expect(squad.players).toHaveLength(4);
    expect(squad.warnings.map((warning) => warning.code)).toEqual(
      expect.arrayContaining(["UNKNOWN_POSITION", "MISSING_FIELD"]),
    );
  });

  it("conserva el primer dorsal duplicado por updatedAt (caso borde 15)", () => {
    const squad = normalizeSquadPayload(
      {
        provider,
        fetchedAt: "2026-01-15T10:00:00.000Z",
        players: [
          { id: 10, name: "Primero Actualizado", position: "DF", shirtNumber: 5, updatedAt: "2026-01-01" },
          { id: 11, name: "Segundo Actualizado", position: "DF", shirtNumber: 5, updatedAt: "2026-02-01" },
        ],
      },
      provider,
    );
    expect(squad.players.map((player) => player.name)).toEqual(["Primero Actualizado"]);
    expect(squad.warnings.some((warning) => warning.code === "DUPLICATE_NUMBER")).toBe(true);
  });

  it("advierte y elimina jugadores repetidos", () => {
    const squad = normalizeSquadPayload(
      {
        provider,
        fetchedAt: "2026-01-15T10:00:00.000Z",
        players: [
          { id: 1, name: "Franco Armani", position: "GK", shirtNumber: 1 },
          { id: 1, name: "Franco Armani Bis", position: "GK", shirtNumber: 2 },
        ],
      },
      provider,
    );
    expect(squad.players).toHaveLength(1);
    expect(squad.warnings.some((warning) => warning.code === "DUPLICATE_PLAYER")).toBe(true);
  });

  it("advierte por dorsales inválidos", () => {
    const squad = normalizeSquadPayload(
      {
        provider,
        fetchedAt: "2026-01-15T10:00:00.000Z",
        players: [{ id: 1, name: "A", position: "GK", shirtNumber: 0 }],
      },
      provider,
    );
    expect(squad.warnings.some((warning) => warning.code === "INVALID_SHIRT_NUMBER")).toBe(true);
  });

  it("no acepta un payload vacío (caso borde 16)", () => {
    const squad = normalizeSquadPayload({ players: [] }, provider);
    expect(squad.players).toEqual([]);
    expect(squad.warnings.map((warning) => warning.code)).toContain("EMPTY_PAYLOAD");
    expect(validateSquad(squad).valid).toBe(false);
  });
});

describe("R-SQUAD — validación y resolución", () => {
  it("valida una plantilla correcta", () => {
    const result = validateSquad(normalizeSquadPayload(raw, provider));
    expect(result).toMatchObject({ valid: true, playerCount: 4 });
    expect(result.errors).toEqual([]);
  });

  it("detecta dorsales e IDs duplicados", () => {
    const base = normalizeSquadPayload(raw, provider);
    const broken: SquadSnapshot = {
      ...base,
      players: [
        { ...base.players[0]!, shirtNumber: 5 },
        { ...base.players[1]!, id: base.players[0]!.id, shirtNumber: 5 },
      ],
    };
    const result = validateSquad(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(["DUPLICATE_PLAYER", "DUPLICATE_NUMBER"]),
    );
  });

  it("resuelve jugadores por ID canónico", () => {
    const squad = normalizeSquadPayload(raw, provider);
    expect(resolveSquadPlayer(squad, "test-provider:3")?.name).toBe("Ignacio Fernández");
    expect(resolveSquadPlayer(squad, "no-existe")).toBeNull();
  });

  it("provee un fallback para jugadores desconocidos (FR-074)", () => {
    const fallback = unknownPlayer("desconocido", 33);
    expect(fallback).toMatchObject({
      id: "desconocido",
      name: "Jugador desconocido",
      shirtNumber: 33,
    });
  });
});
