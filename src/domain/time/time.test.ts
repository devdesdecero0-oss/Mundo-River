import { describe, expect, it } from "vitest";
import {
  addDaysToDateKey,
  addMonthsToMonthKey,
  buildMonthGrid,
  computeCountdown,
  formatCountdown,
  formatDateKeyLong,
  formatLocalDateLong,
  formatLocalDateShort,
  formatLocalDateTime,
  formatLocalDateTimeLong,
  formatLocalDayHeader,
  formatLocalTime,
  formatMonthLabel,
  formatUpdatedAgo,
  getDaysInMonth,
  getLocalParts,
  getMonthKey,
  getMonthKeyFromDateKey,
  getWeekdayFromDateKey,
  isSameLocalDay,
  toLocalDateKey,
  type DateKey,
} from "@/domain/time";

const AR = "America/Argentina/Buenos_Aires";
const MADRID = "Europe/Madrid";
const NEW_YORK = "America/New_York";
const TOKYO = "Asia/Tokyo";

describe("R-TZ — fecha local por zona horaria", () => {
  it("asigna el kickoff nocturno UTC al día local anterior en Buenos Aires (SC-002)", () => {
    expect(toLocalDateKey("2026-03-15T01:30:00Z", AR)).toBe("2026-03-14");
    expect(formatLocalTime("2026-03-15T01:30:00Z", AR)).toBe("22:30");
  });

  it("muestra el mismo instante en el día siguiente en Madrid (SC-002)", () => {
    expect(toLocalDateKey("2026-03-15T01:30:00Z", MADRID)).toBe("2026-03-15");
    expect(formatLocalTime("2026-03-15T01:30:00Z", MADRID)).toBe("02:30");
  });

  it("maneja el cambio de horario de verano en Nueva York", () => {
    expect(toLocalDateKey("2026-11-01T04:30:00Z", NEW_YORK)).toBe("2026-11-01");
    expect(formatLocalTime("2026-11-01T04:30:00Z", NEW_YORK)).toBe("00:30");
    expect(toLocalDateKey("2026-06-15T03:30:00Z", NEW_YORK)).toBe("2026-06-14");
    expect(formatLocalTime("2026-06-15T03:30:00Z", NEW_YORK)).toBe("23:30");
  });

  it("cruza el año correctamente en Buenos Aires", () => {
    expect(toLocalDateKey("2027-01-01T02:00:00Z", AR)).toBe("2026-12-31");
  });

  it("funciona para un usuario en Tokio con un partido de tarde argentina", () => {
    expect(toLocalDateKey("2026-03-14T23:30:00Z", TOKYO)).toBe("2026-03-15");
    expect(formatLocalTime("2026-03-14T23:30:00Z", TOKYO)).toBe("08:30");
  });

  it("tolera instantes como Date y rechaza fechas inválidas", () => {
    expect(toLocalDateKey(new Date("2026-03-15T01:30:00Z"), AR)).toBe("2026-03-14");
    expect(() => toLocalDateKey("no-es-fecha", AR)).toThrow(RangeError);
  });

  it("descompone componentes locales con hourCycle h23", () => {
    expect(getLocalParts("2026-03-15T03:05:09Z", AR)).toEqual({
      year: 2026,
      month: 3,
      day: 15,
      hour: 0,
      minute: 5,
      second: 9,
    });
  });
});

describe("formato es-AR", () => {
  it("formatea fecha y hora cortas", () => {
    expect(formatLocalDateShort("2026-03-15T01:30:00Z", AR)).toBe("sáb 14 mar");
    expect(formatLocalDateTime("2026-03-15T01:30:00Z", AR)).toBe("sáb 14 mar · 22:30");
  });

  it("formatea fecha larga y fecha-hora larga", () => {
    expect(formatLocalDateLong("2026-03-15T01:30:00Z", AR)).toBe("Sábado 14 de marzo de 2026");
    expect(formatLocalDateTimeLong("2026-03-15T01:30:00Z", AR)).toBe(
      "Sábado 14 de marzo de 2026 · 22:30",
    );
  });

  it("genera encabezados relativos Hoy / Mañana / Ayer", () => {
    const now = "2026-03-14T15:00:00Z"; // 12:00 en Buenos Aires
    expect(formatLocalDayHeader("2026-03-14" as DateKey, AR, now)).toBe("Hoy");
    expect(formatLocalDayHeader("2026-03-15" as DateKey, AR, now)).toBe("Mañana");
    expect(formatLocalDayHeader("2026-03-13" as DateKey, AR, now)).toBe("Ayer");
    expect(formatLocalDayHeader("2026-04-01" as DateKey, AR, now)).toBe("Miércoles 1 de abril");
  });

  it("formatea una clave de fecha sin depender de la zona", () => {
    expect(formatDateKeyLong("2026-12-31" as DateKey)).toBe("Jueves 31 de diciembre");
  });

  it("formatea etiquetas de mes", () => {
    expect(formatMonthLabel("2026-03")).toBe("Marzo 2026");
  });
});

describe("claves de calendario", () => {
  it("deriva el mes local y su clave", () => {
    expect(getMonthKey("2026-04-01T02:00:00Z", AR)).toBe("2026-03");
    expect(getMonthKey("2026-04-01T02:00:00Z", MADRID)).toBe("2026-04");
    expect(getMonthKeyFromDateKey("2026-08-19" as DateKey)).toBe("2026-08");
  });

  it("suma días cruzando meses y años", () => {
    expect(addDaysToDateKey("2026-03-31" as DateKey, 1)).toBe("2026-04-01");
    expect(addDaysToDateKey("2026-12-31" as DateKey, 1)).toBe("2027-01-01");
    expect(addDaysToDateKey("2026-01-01" as DateKey, -1)).toBe("2025-12-31");
    expect(addDaysToDateKey("2028-02-28" as DateKey, 1)).toBe("2028-02-29");
  });

  it("calcula día de la semana y días del mes", () => {
    expect(getWeekdayFromDateKey("2026-03-14" as DateKey)).toBe(6); // sábado
    expect(getDaysInMonth("2026-02")).toBe(28);
    expect(getDaysInMonth("2028-02")).toBe(29);
  });

  it("suma meses a una clave de mes", () => {
    expect(addMonthsToMonthKey("2026-01", -1)).toBe("2025-12");
    expect(addMonthsToMonthKey("2026-12", 1)).toBe("2027-01");
    expect(addMonthsToMonthKey("2026-06", 7)).toBe("2027-01");
    expect(addMonthsToMonthKey("2026-06", -18)).toBe("2024-12");
  });

  it("construye una grilla de 6 semanas que arranca en lunes", () => {
    const grid = buildMonthGrid("2026-03");
    expect(grid).toHaveLength(42);
    expect(getWeekdayFromDateKey(grid[0]!.dateKey)).toBe(1);
    expect(grid.some((day) => day.dateKey === "2026-03-01" && day.inMonth)).toBe(true);
    expect(grid.some((day) => day.dateKey === "2026-04-01" && !day.inMonth)).toBe(true);
  });

  it("compara si dos instantes caen el mismo día local", () => {
    expect(isSameLocalDay("2026-03-15T01:30:00Z", "2026-03-14T15:00:00Z", AR)).toBe(true);
    expect(isSameLocalDay("2026-03-15T01:30:00Z", "2026-03-15T15:00:00Z", AR)).toBe(false);
  });
});

describe("cuenta regresiva", () => {
  it("descompone días, horas y minutos", () => {
    const countdown = computeCountdown("2026-03-15T01:30:00Z", "2026-03-13T23:00:00Z");
    expect(countdown.days).toBe(1);
    expect(countdown.hours).toBe(2);
    expect(countdown.minutes).toBe(30);
    expect(countdown.isPast).toBe(false);
    expect(formatCountdown(countdown)).toContain("1d");
  });

  it("no genera valores negativos cuando el objetivo ya pasó", () => {
    const countdown = computeCountdown("2026-03-15T01:30:00Z", "2026-03-16T01:30:00Z");
    expect(countdown).toMatchObject({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
    expect(formatCountdown(countdown)).toBe("Comenzó");
  });

  it("formatea el estado de actualización", () => {
    expect(formatUpdatedAgo(2)).toBe("Actualizado ahora");
    expect(formatUpdatedAgo(12)).toBe("Actualizado hace 12 s");
    expect(formatUpdatedAgo(90)).toBe("Actualizado hace 1 min");
  });
});
