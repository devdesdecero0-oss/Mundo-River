import type {
  Player,
  PlayerAvailability,
  PlayerPosition,
  ProviderRef,
  RawPlayer,
  RawSquadPayload,
  SquadMembership,
  SquadSnapshot,
  SquadValidationResult,
  SquadWarning,
} from "@/domain/types";

const POSITION_MAP: Record<string, PlayerPosition> = {
  GK: "GK",
  G: "GK",
  POR: "GK",
  GOALKEEPER: "GK",
  ARQUERO: "GK",
  DF: "DF",
  D: "DF",
  DEF: "DF",
  DEFENDER: "DF",
  DEFENSOR: "DF",
  MF: "MF",
  M: "MF",
  MED: "MF",
  MIDFIELDER: "MF",
  MEDIOCAMPISTA: "MF",
  FW: "FW",
  F: "FW",
  DEL: "FW",
  FORWARD: "FW",
  DELANTERO: "FW",
};

const AVAILABILITY_MAP: Record<string, PlayerAvailability> = {
  available: "available",
  fit: "available",
  injured: "injured",
  injury: "injured",
  suspended: "suspended",
  suspension: "suspended",
};

const POSITION_ORDER: Record<PlayerPosition, number> = { GK: 0, DF: 1, MF: 2, FW: 3 };

export interface SquadContext {
  teamId: string;
  seasonId: string;
  from: string;
}

const DEFAULT_CONTEXT: SquadContext = {
  teamId: "river",
  seasonId: "2026",
  from: "2026-01-01",
};

/**
 * R-SQUAD — Normaliza un jugador del proveedor al contrato interno.
 * Devuelve `null` si faltan datos obligatorios (id, nombre o posición válida).
 */
export function mapProviderPlayer(raw: RawPlayer, provider: string): Player | null {
  const externalId = raw.id === undefined || raw.id === null ? "" : String(raw.id).trim();
  const name = (raw.name ?? raw.displayName ?? "").trim();
  const positionKey = (raw.position ?? "").trim().toUpperCase();
  const position = POSITION_MAP[positionKey];

  if (!externalId || !name || !position) return null;

  const shirtNumber = parseShirtNumber(raw.shirtNumber);

  const providerRef: ProviderRef = {
    provider,
    externalId,
    updatedAt: raw.updatedAt ?? "",
  };

  const availability = mapAvailability(raw.availability);
  const injury = mapInjury(raw.injuryType, raw.injuryExpectedReturn);

  return {
    id: `${provider}:${externalId}`,
    name,
    displayName: (raw.displayName ?? name).trim(),
    shirtNumber,
    position,
    nationality: (raw.nationality ?? "Sin dato").trim(),
    photo: raw.photo,
    isCaptain: raw.isCaptain ?? false,
    providerRef,
    contractUntil: isValidDateOnly(raw.contractUntil) ? raw.contractUntil : undefined,
    ...(availability ? { availability } : {}),
    ...(injury ? { injury } : {}),
  };
}

/**
 * R-SQUAD — Normaliza el payload completo de la plantilla.
 *
 * - IDs canónicos deterministas e idempotentes.
 * - Omite jugadores inválidos y registra advertencias.
 * - Dorsales duplicados: conserva el primero por `updatedAt` (y avisa).
 * - Payload vacío: plantilla vacía con advertencia `EMPTY_PAYLOAD`.
 */
export function normalizeSquadPayload(
  raw: RawSquadPayload,
  provider: string,
  context: SquadContext = DEFAULT_CONTEXT,
): SquadSnapshot {
  const rawPlayers = raw.players ?? [];
  const warnings: SquadWarning[] = [];
  const accepted: Array<{ player: Player; updatedAt: string; index: number }> = [];
  const seenIds = new Set<string>();

  if (rawPlayers.length === 0) {
    warnings.push({
      code: "EMPTY_PAYLOAD",
      message: "El proveedor no devolvió jugadores para la plantilla.",
    });
  }

  rawPlayers.forEach((candidate, index) => {
    const externalId =
      candidate.id === undefined || candidate.id === null ? undefined : String(candidate.id);

    const positionKey = (candidate.position ?? "").trim().toUpperCase();
    if (positionKey && !POSITION_MAP[positionKey]) {
      warnings.push({
        code: "UNKNOWN_POSITION",
        externalId,
        message: `Posición desconocida "${candidate.position}" — jugador omitido.`,
      });
    }

    const player = mapProviderPlayer(candidate, provider);
    if (!player) {
      warnings.push({
        code: "MISSING_FIELD",
        externalId,
        message: "Faltan campos obligatorios (id, nombre o posición) — jugador omitido.",
      });
      return;
    }

    if (parseShirtNumber(candidate.shirtNumber) === 0) {
      warnings.push({
        code: "INVALID_SHIRT_NUMBER",
        externalId,
        message: `Dorsal inválido para ${player.name}; se usa 0 (sin dorsal).`,
      });
    }

    if (seenIds.has(player.id)) {
      warnings.push({
        code: "DUPLICATE_PLAYER",
        externalId,
        message: `Jugador duplicado ${player.id} — se conserva la primera aparición.`,
      });
      return;
    }

    seenIds.add(player.id);
    accepted.push({
      player,
      updatedAt: candidate.updatedAt ?? "",
      index,
    });
  });

  // Dorsales duplicados: se conserva el primero por updatedAt (los vacíos al final).
  const byShirt = new Map<number, Array<{ player: Player; updatedAt: string; index: number }>>();
  for (const entry of accepted) {
    if (entry.player.shirtNumber === 0) continue;
    const bucket = byShirt.get(entry.player.shirtNumber) ?? [];
    bucket.push(entry);
    byShirt.set(entry.player.shirtNumber, bucket);
  }

  const discarded = new Set<string>();
  for (const [shirtNumber, entries] of [...byShirt.entries()].sort(([a], [b]) => a - b)) {
    if (entries.length < 2) continue;
    const ordered = [...entries].sort((a, b) => {
      if (a.updatedAt !== b.updatedAt) {
        // Orden ascendente: el primero en actualizarse prevalece.
        if (!a.updatedAt) return 1;
        if (!b.updatedAt) return -1;
        return a.updatedAt.localeCompare(b.updatedAt);
      }
      return a.index - b.index;
    });
    const [keep, ...rest] = ordered;
    if (!keep) continue;
    for (const entry of rest) {
      discarded.add(entry.player.id);
      warnings.push({
        code: "DUPLICATE_NUMBER",
        externalId: entry.player.providerRef?.externalId,
        message: `Dorsal ${shirtNumber} duplicado: se conserva ${keep.player.name}.`,
      });
    }
  }

  const players = accepted
    .filter((entry) => !discarded.has(entry.player.id))
    .map((entry) => entry.player)
    .sort(comparePlayers);

  const memberships: SquadMembership[] = players.map((player) => ({
    playerId: player.id,
    teamId: context.teamId,
    seasonId: context.seasonId,
    shirtNumber: player.shirtNumber,
    position: player.position,
    role: "rotation",
    from: context.from,
  }));

  return {
    provider,
    fetchedAt: raw.fetchedAt ?? "",
    checksum: computeSquadChecksum(players),
    players,
    memberships,
    warnings,
  };
}

/** R-SQUAD — Validación estructural de una plantilla ya normalizada. */
export function validateSquad(squad: SquadSnapshot): SquadValidationResult {
  const errors: SquadWarning[] = [];
  const warnings: SquadWarning[] = [];
  const ids = new Set<string>();
  const numbers = new Map<number, string>();

  for (const player of squad.players) {
    if (ids.has(player.id)) {
      errors.push({
        code: "DUPLICATE_PLAYER",
        externalId: player.providerRef?.externalId,
        message: `ID canónico duplicado: ${player.id}.`,
      });
    }
    ids.add(player.id);

    if (player.shirtNumber < 1 || player.shirtNumber > 99) {
      warnings.push({
        code: "INVALID_SHIRT_NUMBER",
        externalId: player.providerRef?.externalId,
        message: `Dorsal fuera de rango para ${player.name}.`,
      });
    } else if (numbers.has(player.shirtNumber)) {
      errors.push({
        code: "DUPLICATE_NUMBER",
        externalId: player.providerRef?.externalId,
        message: `Dorsal ${player.shirtNumber} repetido (${player.name}).`,
      });
    } else {
      numbers.set(player.shirtNumber, player.id);
    }

    if (!["GK", "DF", "MF", "FW"].includes(player.position)) {
      errors.push({
        code: "UNKNOWN_POSITION",
        externalId: player.providerRef?.externalId,
        message: `Posición inválida para ${player.name}.`,
      });
    }  }

  if (squad.players.length === 0) {
    warnings.push({
      code: "EMPTY_PAYLOAD",
      message: "La plantilla normalizada está vacía.",
    });
  }

  return {
    valid: errors.length === 0 && squad.players.length > 0,
    playerCount: squad.players.length,
    errors,
    warnings: [...squad.warnings, ...warnings],
  };
}

/** R-SQUAD — Resolución de jugador por ID canónico. */
export function resolveSquadPlayer(squad: SquadSnapshot, playerId: string): Player | null {
  return squad.players.find((player) => player.id === playerId) ?? null;
}

/** Firma estable de la plantilla, usada como checksum del snapshot. */
export function computeSquadChecksum(players: readonly Player[]): string {
  const payload = players
    .map((player) => `${player.id}|${player.shirtNumber}|${player.position}`)
    .join(";");
  let hash = 0x811c9dc5;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/** Datos mínimos para renderizar un jugador ausente sin romper la ficha. */
export function unknownPlayer(playerId: string, shirtNumber = 0): Player {
  return {
    id: playerId,
    name: "Jugador desconocido",
    displayName: "Jugador desconocido",
    shirtNumber,
    position: "MF",
    nationality: "Sin dato",
  };
}

function mapAvailability(value: string | undefined): PlayerAvailability | undefined {
  const key = (value ?? "").trim().toLowerCase();
  if (!key) return undefined;
  return AVAILABILITY_MAP[key] ?? "unknown";
}

function mapInjury(type: string | undefined, expectedReturn: string | undefined): Player["injury"] {
  const injuryType = (type ?? "").trim();
  if (!injuryType) return undefined;
  return {
    type: injuryType,
    ...(isValidDateOnly(expectedReturn) ? { expectedReturn } : {}),
  };
}

function parseShirtNumber(value: number | string | undefined): number {
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 1 && value <= 99 ? value : 0;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value.trim(), 10);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 99 ? parsed : 0;
  }
  return 0;
}

function isValidDateOnly(value: string | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function comparePlayers(a: Player, b: Player): number {
  const positionDiff = POSITION_ORDER[a.position] - POSITION_ORDER[b.position];
  if (positionDiff !== 0) return positionDiff;
  const numberDiff = (a.shirtNumber || 100) - (b.shirtNumber || 100);
  if (numberDiff !== 0) return numberDiff;
  return lastName(a.name).localeCompare(lastName(b.name), "es-AR");
}

function lastName(name: string): string {
  const tokens = name.trim().split(/\s+/);
  return tokens[tokens.length - 1] ?? name;
}
