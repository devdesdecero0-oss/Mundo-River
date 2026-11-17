import { describe, expect, it } from "vitest";
import { getMatchDetail } from "@/domain/calendar/match-detail";
import type { Match } from "@/domain/types";

const baseMatch: Match = {
  id: "match-1",
  seasonId: "season-1",
  competitionId: "competition-1",
  round: "Fecha 1",
  kickoffAt: "2026-11-20T22:00:00Z",
  venue: "Estadio Monumental",
  homeTeamId: "river",
  awayTeamId: "boca",
  events: [],
};

describe("R-CALENDAR-DETAIL — contenido contextual", () => {
  it("muestra sede y hora para un partido próximo", () => {
    const detail = getMatchDetail(baseMatch, new Date("2026-11-20T20:00:00Z"), "UTC");

    expect(detail.status).toBe("scheduled");
    expect(detail.time).toBe("22:00");
    expect(detail.venue).toBe("Estadio Monumental");
    expect(detail.score).toBeNull();
  });

  it("muestra sede y resultado para un partido finalizado", () => {
    const detail = getMatchDetail(
      {
        ...baseMatch,
        score: { home: 2, away: 1 },
        finishedAt: "2026-11-20T23:55:00Z",
      },
      new Date("2026-11-21T00:00:00Z"),
      "UTC",
    );

    expect(detail.status).toBe("finished");
    expect(detail.score).toBe("2 - 1");
    expect(detail.venue).toBe("Estadio Monumental");
  });

  it("muestra motivo solo cuando existe en aplazados o suspendidos", () => {
    const postponed = getMatchDetail(
      { ...baseMatch, statusOverride: "postponed", statusReason: "Clima adverso" },
      new Date("2026-11-20T20:00:00Z"),
      "UTC",
    );
    const suspended = getMatchDetail(
      { ...baseMatch, statusOverride: "suspended" },
      new Date("2026-11-20T20:00:00Z"),
      "UTC",
    );

    expect(postponed.reason).toBe("Clima adverso");
    expect(suspended.reason).toBeNull();
    expect(suspended.status).toBe("suspended");
  });

  it("muestra resultado y minuto durante un partido en vivo", () => {
    const detail = getMatchDetail(
      {
        ...baseMatch,
        providerStatus: "live",
        providerMinute: 67,
        score: { home: 1, away: 0 },
      },
      new Date("2026-11-20T22:10:00Z"),
      "UTC",
    );

    expect(detail.status).toBe("live");
    expect(detail.score).toBe("1 - 0");
    expect(detail.minuteLabel).toBe("67'");
  });

  it("usa textos de respaldo para sede y marcador ausentes", () => {
    const detail = getMatchDetail(
      { ...baseMatch, venue: "", statusOverride: "cancelled" },
      new Date("2026-11-20T20:00:00Z"),
      "UTC",
    );

    expect(detail.venue).toBe("Sede no informada");
    expect(detail.score).toBeNull();
    expect(detail.statusLabel).toBe("Cancelado");
  });
});
