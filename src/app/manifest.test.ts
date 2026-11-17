import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

const icons = manifest().icons ?? [];
const shortcuts = manifest().shortcuts ?? [];

describe("manifest — instalación de la PWA", () => {
  it("declara identidad, arranque y modo standalone", () => {
    const value = manifest();
    expect(value.name).toBe("Mundo River");
    expect(value.short_name).toBe("Mundo River");
    expect(value.start_url).toBe("/");
    expect(value.scope).toBe("/");
    expect(value.display).toBe("standalone");
    expect(value.lang).toBe("es-AR");
    expect(value.background_color).toBe("#0b0b0e");
    expect(value.theme_color).toBe("#0b0b0e");
  });

  it("incluye íconos 192 y 512 para instalar", () => {
    expect(icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }),
        expect.objectContaining({ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }),
      ]),
    );
  });

  it("incluye variantes maskable para Android", () => {
    const maskable = icons.filter((icon) => icon.purpose === "maskable");
    expect(maskable.map((icon) => icon.sizes)).toEqual(
      expect.arrayContaining(["192x192", "512x512"]),
    );
  });

  it("agrega atajos a Calendario y Novedades", () => {
    expect(shortcuts.map((shortcut) => shortcut.url)).toEqual(["/calendario", "/novedades"]);
    expect(shortcuts.every((shortcut) => Boolean(shortcut.name))).toBe(true);
  });
});
