import type { Match, MatchStatus } from "@/domain/types";

export interface StatusConfig {
  /** Ventana máxima en minutos durante la que un partido se considera en juego. */
  liveWindowMinutes?: number;
}

const DEFAULT_LIVE_WINDOW = 120;

/**
 * R-STATUS — Deriva el estado de un partido.
 *
 * Prioridad:
 * 1. Estado explícito de la fuente (`statusOverride`).
 * 2. Marcador + `finishedAt` ⇒ finalizado.
 * 3. `now < kickoff` ⇒ programado.
 * 4. Dentro de la ventana de juego ⇒ en vivo / entretiempo.
 * 5. Resto ⇒ finalizado derivado.
 */
export function deriveMatchStatus(
  match: Match,
  now: Date | string,
  config: StatusConfig = {},
): MatchStatus {
  // R-DATA-01: el estado del proveedor manda sobre cualquier derivación local.
  if (match.providerStatus) return match.providerStatus;

  if (
    match.statusOverride === "postponed" ||
    match.statusOverride === "suspended" ||
    match.statusOverride === "cancelled" ||
    match.statusOverride === "finished"
  ) {
    return match.statusOverride;
  }

  if (match.score !== undefined && match.finishedAt !== undefined) return "finished";

  const nowMs = toMillis(now);
  const kickoffMs = toMillis(match.kickoffAt);
  if (nowMs < kickoffMs) return "scheduled";

  const windowMinutes = match.liveWindowMinutes ?? config.liveWindowMinutes ?? DEFAULT_LIVE_WINDOW;
  const windowMs = windowMinutes * 60_000;

  if (nowMs < kickoffMs + windowMs) {
    return match.period === "HT" ? "halftime" : "live";
  }

  return "finished";
}

export function isLiveStatus(status: MatchStatus): boolean {
  return status === "live" || status === "halftime";
}

export function isPlayedStatus(status: MatchStatus): boolean {
  return status === "finished";
}

/**
 * R-TIME — Minuto de juego para partidos en vivo.
 *
 * Devuelve `null` cuando el partido no está en juego. Considera el
 * entretiempo (45') y los descuentos configurados. Nunca supera
 * `90 + descuento` salvo alargue.
 */
export function computeMatchMinute(match: Match, now: Date | string): number | null {
  const status = deriveMatchStatus(match, now);
  if (!isLiveStatus(status)) return null;

  // R-DATA-02: si el proveedor informa el minuto, se usa tal cual.
  if (
    typeof match.providerMinute === "number" &&
    Number.isFinite(match.providerMinute)
  ) {
    return Math.max(0, Math.floor(match.providerMinute));
  }

  const elapsed = Math.floor((toMillis(now) - toMillis(match.kickoffAt)) / 60_000);
  const stoppageFirst = match.stoppageFirstHalf ?? 0;
  const stoppageSecond = match.stoppageSecondHalf ?? 0;
  const period = match.period;

  if (status === "halftime" || period === "HT") return 45;

  let minute = elapsed;

  if (period === "2H" || period === "ET" || period === "PEN") {
    // 15 minutos de entretiempo.
    minute = elapsed - 15;
  } else if (elapsed > 60) {
    // El período no está informado, pero el reloj ya pasó el entretiempo.
    minute = elapsed - 15;
  }
  if (period === "ET") minute = elapsed - 20; // entretiempo + pausa previa al alargue
  if (period === "PEN") minute = 120;

  if (period === "1H" || (period === undefined && elapsed <= 60)) {
    minute = Math.min(minute, 45 + stoppageFirst);
  }

  const cap = period === "ET" || period === "PEN" ? 120 + stoppageSecond : 90 + stoppageSecond;
  return Math.max(1, Math.min(minute, cap));
}

function toMillis(value: string | Date): number {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new RangeError(`Fecha inválida: ${String(value)}`);
  return date.getTime();
}
