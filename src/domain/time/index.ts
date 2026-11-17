import type { Countdown, DateKey, MonthKey } from "@/domain/types";

export type { DateKey, MonthKey } from "@/domain/types";

/**
 * Utilidades de fecha y hora 100 % puras.
 *
 * Regla de oro (FR-002 / FR-003 / FR-009): nunca se usan
 * `toISOString().slice(0,10)`, `getDate()`, `getMonth()` ni `getDay()`.
 * Toda conversión instante → calendario pasa por `Intl.DateTimeFormat`
 * con `timeZone` explícito.
 */

const LOCALE = "es-AR";

type FormatterOptions = Intl.DateTimeFormatOptions;

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string, options: FormatterOptions): Intl.DateTimeFormat {
  const key = `${timeZone}|${JSON.stringify(options)}`;
  const cached = formatterCache.get(key);
  if (cached) return cached;

  const created = new Intl.DateTimeFormat(LOCALE, { ...options, timeZone });
  formatterCache.set(key, created);
  return created;
}

function toDate(instant: string | Date): Date {
  const date = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Instante inválido: ${String(instant)}`);
  }
  return date;
}

export interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** Descompone un instante en sus componentes de calendario local. */
export function getLocalParts(instant: string | Date, timeZone: string): LocalParts {
  const parts = formatter(timeZone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(toDate(instant));

  const value = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((candidate) => candidate.type === type);
    if (!part) throw new RangeError(`No se pudo obtener "${type}" para ${timeZone}`);
    return Number(part.value);
  };

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

/** Clave de día calendario local `AAAA-MM-DD`. */
export function toLocalDateKey(instant: string | Date, timeZone: string): DateKey {
  const { year, month, day } = getLocalParts(instant, timeZone);
  return `${year}-${pad(month)}-${pad(day)}` as DateKey;
}

/** Clave de mes local `AAAA-MM`. */
export function getMonthKey(instant: string | Date, timeZone: string): MonthKey {
  const { year, month } = getLocalParts(instant, timeZone);
  return `${year}-${pad(month)}` as MonthKey;
}

/** Deriva la clave de mes de una clave de día (operación de calendario puro). */
export function getMonthKeyFromDateKey(dateKey: DateKey): MonthKey {
  return dateKey.slice(0, 7) as MonthKey;
}

/** Hora local `HH:mm`. */
export function formatLocalTime(instant: string | Date, timeZone: string): string {
  return formatter(timeZone, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(toDate(instant));
}

function weekdayShort(instant: string | Date, timeZone: string): string {
  return formatter(timeZone, { weekday: "short" }).format(toDate(instant)).replace(".", "");
}

function monthShort(instant: string | Date, timeZone: string): string {
  return formatter(timeZone, { month: "short" }).format(toDate(instant)).replace(".", "");
}

/** `sáb 14 mar` */
export function formatLocalDateShort(instant: string | Date, timeZone: string): string {
  const { day } = getLocalParts(instant, timeZone);
  return `${weekdayShort(instant, timeZone)} ${day} ${monthShort(instant, timeZone)}`;
}

/** `sábado 14 de marzo de 2026` */
export function formatLocalDateLong(instant: string | Date, timeZone: string): string {
  const raw = formatter(timeZone, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(toDate(instant));
  return capitalize(raw.replace(/,/g, ""));
}

/** `sáb 14 mar · 22:30` */
export function formatLocalDateTime(instant: string | Date, timeZone: string): string {
  return `${formatLocalDateShort(instant, timeZone)} · ${formatLocalTime(instant, timeZone)}`;
}

/** `sábado 14 de marzo · 22:30` */
export function formatLocalDateTimeLong(instant: string | Date, timeZone: string): string {
  const date = formatLocalDateLong(instant, timeZone);
  return `${date} · ${formatLocalTime(instant, timeZone)}`;
}

/**
 * Etiqueta relativa de un encabezado de día:
 * «Hoy», «Mañana», «Ayer» o la fecha larga «Sábado 14 de marzo».
 */
export function formatLocalDayHeader(
  dateKey: DateKey,
  timeZone: string,
  now: Date | string = new Date(),
): string {
  const today = toLocalDateKey(now, timeZone);
  if (dateKey === today) return "Hoy";
  if (dateKey === addDaysToDateKey(today, 1)) return "Mañana";
  if (dateKey === addDaysToDateKey(today, -1)) return "Ayer";
  return formatDateKeyLong(dateKey);
}

/** Formatea una clave de día sin depender de la zona del usuario. */
export function formatDateKeyLong(dateKey: DateKey): string {
  const { year, month, day } = parseDateKey(dateKey);
  const raw = new Intl.DateTimeFormat(LOCALE, {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
  return capitalize(raw.replace(/,/g, ""));
}

/** Formatea una clave de mes: `Marzo 2026`. */
export function formatMonthLabel(monthKey: MonthKey): string {
  const [yearPart, monthPart] = monthKey.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const raw = new Intl.DateTimeFormat(LOCALE, {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1, 12)));
  return capitalize(raw.replace(" de ", " "));
}

/** Suma meses a una clave `AAAA-MM` (aritmética de calendario). */
export function addMonthsToMonthKey(monthKey: MonthKey, delta: number): MonthKey {
  const [yearPart, monthPart] = monthKey.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const total = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(total / 12);
  const nextMonth = (total % 12 + 12) % 12;
  return `${nextYear}-${pad(nextMonth + 1)}` as MonthKey;
}

export function parseDateKey(dateKey: DateKey): { year: number; month: number; day: number } {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) throw new RangeError(`Clave de fecha inválida: ${dateKey}`);
  return { year, month, day };
}

/**
 * Suma días a una clave de calendario. Es aritmética de calendario,
 * no de instantes: se hace en UTC para evitar cualquier DST.
 */
export function addDaysToDateKey(dateKey: DateKey, days: number): DateKey {
  const { year, month, day } = parseDateKey(dateKey);
  const shifted = new Date(Date.UTC(year, month - 1, day + days, 12));
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(
    shifted.getUTCDate(),
  )}` as DateKey;
}

/** Día de la semana de una clave (0 = domingo … 6 = sábado). */
export function getWeekdayFromDateKey(dateKey: DateKey): number {
  const { year, month, day } = parseDateKey(dateKey);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

export function getDaysInMonth(monthKey: MonthKey): number {
  const [yearPart, monthPart] = monthKey.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  return new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
}

export interface MonthGridDay {
  dateKey: DateKey;
  inMonth: boolean;
}

/**
 * Grilla de 6 semanas (42 celdas) que empieza en lunes y rellena
 * con días de los meses vecinos.
 */
export function buildMonthGrid(monthKey: MonthKey): MonthGridDay[] {
  const [yearPart, monthPart] = monthKey.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const firstDay = `${year}-${pad(month)}-01` as DateKey;
  const firstWeekday = getWeekdayFromDateKey(firstDay);
  const mondayOffset = (firstWeekday + 6) % 7;
  const start = addDaysToDateKey(firstDay, -mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const dateKey = addDaysToDateKey(start, index);
    return { dateKey, inMonth: getMonthKeyFromDateKey(dateKey) === monthKey };
  });
}

/** Cuenta regresiva pura: recibe el instante objetivo y el «ahora». */
export function computeCountdown(target: string | Date, now: Date | string): Countdown {
  const diff = Math.max(0, toDate(target).getTime() - toDate(now).getTime());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    totalMs: diff,
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    isPast: diff === 0,
  };
}

export function formatCountdown(countdown: Countdown): string {
  if (countdown.isPast) return "Comenzó";
  const parts: string[] = [];
  if (countdown.days > 0) parts.push(`${countdown.days}d`);
  if (countdown.days > 0 || countdown.hours > 0) parts.push(`${countdown.hours}h`);
  parts.push(`${countdown.minutes}m`);
  if (countdown.days === 0) parts.push(`${countdown.seconds}s`);
  return parts.join(" ");
}

/** Texto «Actualizado hace X s / X min». */
export function formatUpdatedAgo(secondsAgo: number): string {
  if (secondsAgo < 5) return "Actualizado ahora";
  if (secondsAgo < 60) return `Actualizado hace ${Math.floor(secondsAgo)} s`;
  const minutes = Math.floor(secondsAgo / 60);
  return `Actualizado hace ${minutes} min`;
}

export function isSameLocalDay(
  first: string | Date,
  second: string | Date,
  timeZone: string,
): boolean {
  return toLocalDateKey(first, timeZone) === toLocalDateKey(second, timeZone);
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
