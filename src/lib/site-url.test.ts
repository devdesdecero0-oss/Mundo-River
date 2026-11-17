import { describe, expect, it } from "vitest";
import { normalizeSiteUrl, resolveSiteUrl, SITE_URL_FALLBACK } from "@/lib/site-url";

describe("site-url — URL pública del sitio", () => {
  it("usa el placeholder cuando no hay variables", () => {
    expect(resolveSiteUrl({})).toBe(SITE_URL_FALLBACK);
  });

  it("prioriza NEXT_PUBLIC_SITE_URL y quita el slash final", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://mundoriver.com/" })).toBe(
      "https://mundoriver.com",
    );
  });

  it("agrega https cuando la URL explícita no trae protocolo", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "mundoriver.com" })).toBe(
      "https://mundoriver.com",
    );
  });

  it("permite http para pruebas locales", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" })).toBe(
      "http://localhost:3000",
    );
  });

  it("descarta una URL explícita inválida y sigue con Vercel", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: "no es una url",
        VERCEL_PROJECT_PRODUCTION_URL: "mundo-river.vercel.app",
      }),
    ).toBe("https://mundo-river.vercel.app");
  });

  it("rechaza protocolos inseguros", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "javascript:alert(1)" })).toBe(SITE_URL_FALLBACK);
  });

  it("detecta la URL de producción de Vercel", () => {
    expect(
      resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "mundo-river.vercel.app" }),
    ).toBe("https://mundo-river.vercel.app");
  });

  it("no duplica el protocolo si Vercel ya lo incluye", () => {
    expect(
      resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "https://mundo-river.vercel.app/" }),
    ).toBe("https://mundo-river.vercel.app");
  });

  it("NEXT_PUBLIC_SITE_URL manda sobre Vercel", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: "https://mundoriver.com",
        VERCEL_PROJECT_PRODUCTION_URL: "mundo-river.vercel.app",
      }),
    ).toBe("https://mundoriver.com");
  });
});

describe("site-url — normalización", () => {
  it("elimina query, hash y barras finales", () => {
    expect(normalizeSiteUrl("https://mundoriver.com/nota/?x=1#top")).toBe(
      "https://mundoriver.com/nota",
    );
  });

  it("devuelve null para valores vacíos o inválidos", () => {
    expect(normalizeSiteUrl("")).toBeNull();
    expect(normalizeSiteUrl("   ")).toBeNull();
    expect(normalizeSiteUrl(null)).toBeNull();
    expect(normalizeSiteUrl("mailto:hola@mundoriver.com")).toBeNull();
  });
});
