import { describe, expect, it } from "vitest";
import { canUseLiveProvider, DEFAULT_NEWS_FEEDS, readServerEnv } from "@/lib/env";

describe("env — configuración del servidor", () => {
  it("usa live cuando hay token y no se especifica DATA_MODE", () => {
    const env = readServerEnv({ BZZOIRO_TOKEN: "abc123" });
    expect(env.dataMode).toBe("live");
    expect(env.bzzoiroToken).toBe("abc123");
    expect(canUseLiveProvider(env)).toBe(true);
  });

  it("cae a mock sin token", () => {
    const env = readServerEnv({});
    expect(env.dataMode).toBe("mock");
    expect(env.bzzoiroToken).toBeNull();
    expect(canUseLiveProvider(env)).toBe(false);
  });

  it("respeta DATA_MODE=mock aunque exista token", () => {
    const env = readServerEnv({ BZZOIRO_TOKEN: "abc123", DATA_MODE: " MOCK " });
    expect(env.dataMode).toBe("mock");
    expect(canUseLiveProvider(env)).toBe(false);
  });

  it("expone el token en modo live explícito", () => {
    const env = readServerEnv({ BZZOIRO_TOKEN: "abc123", DATA_MODE: "live" });
    expect(env.dataMode).toBe("live");
    expect(env.bzzoiroToken).toBe("abc123");
  });

  it("rechaza un DATA_MODE desconocido", () => {
    expect(() => readServerEnv({ DATA_MODE: "produccion" })).toThrow(/DATA_MODE/);
  });

  it("parsea feeds separados por comas y descarta URLs inválidas", () => {
    const env = readServerEnv({
      NEWS_FEEDS: "https://a.test/rss, no-es-url ,https://b.test/rss\nhttps://c.test/rss",
    });
    expect(env.newsFeeds).toEqual([
      "https://a.test/rss",
      "https://b.test/rss",
      "https://c.test/rss",
    ]);
  });

  it("usa los feeds por defecto si no hay configuración", () => {
    expect(readServerEnv({}).newsFeeds).toEqual([...DEFAULT_NEWS_FEEDS]);
  });
});
