import { describe, expect, it } from "vitest";
import {
  getThemeInitScript,
  isTheme,
  nextTheme,
  parseThemeMessage,
  readDocumentTheme,
  resolveTheme,
  THEME_COLORS,
  THEME_COOKIE,
} from "./theme";

describe("isTheme", () => {
  it("acepta solo los valores del contrato", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("system")).toBe(false);
    expect(isTheme("")).toBe(false);
    expect(isTheme(null)).toBe(false);
    expect(isTheme(undefined)).toBe(false);
  });
});

describe("resolveTheme", () => {
  it("prioriza la preferencia guardada sobre el sistema", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("sigue al sistema cuando no hay preferencia válida", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(null, false)).toBe("light");
    expect(resolveTheme("system", true)).toBe("dark");
  });
});

describe("nextTheme", () => {
  it("alterna entre claro y oscuro", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });
});

describe("parseThemeMessage", () => {
  it("acepta mensajes válidos entre pestañas", () => {
    expect(parseThemeMessage({ type: "theme", value: "dark" })).toBe("dark");
    expect(parseThemeMessage({ type: "theme", value: "light" })).toBe("light");
  });

  it("ignora mensajes inválidos o de otro tipo", () => {
    expect(parseThemeMessage(null)).toBeNull();
    expect(parseThemeMessage("dark")).toBeNull();
    expect(parseThemeMessage({ type: "other", value: "dark" })).toBeNull();
    expect(parseThemeMessage({ type: "theme", value: "system" })).toBeNull();
    expect(parseThemeMessage({ type: "theme" })).toBeNull();
  });
});

describe("readDocumentTheme", () => {
  it("devuelve null fuera del navegador", () => {
    expect(readDocumentTheme()).toBeNull();
  });
});

describe("getThemeInitScript", () => {
  const script = getThemeInitScript();

  it("usa la cookie y el fallback del sistema", () => {
    expect(script).toContain(THEME_COOKIE);
    expect(script).toContain("prefers-color-scheme: dark");
    expect(script).toContain('classList.toggle("dark"');
  });

  it("sincroniza color-scheme y theme-color antes de pintar", () => {
    expect(script).toContain("colorScheme");
    expect(script).toContain(THEME_COLORS.dark);
    expect(script).toContain(THEME_COLORS.light);
  });
});
