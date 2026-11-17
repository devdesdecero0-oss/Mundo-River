import { describe, expect, it } from "vitest";
import { parseProviderEventId } from "./live";

describe("parseProviderEventId", () => {
  it("acepta el ID canónico con prefijo de proveedor", () => {
    expect(parseProviderEventId("bzzoiro:event:654311")).toBe(654311);
  });

  it("acepta un ID numérico sin prefijo", () => {
    expect(parseProviderEventId("654311")).toBe(654311);
  });

  it("decodifica los parámetros codificados que entrega Next.js", () => {
    expect(parseProviderEventId("bzzoiro%3Aevent%3A654311")).toBe(654311);
  });

  it("ignora espacios alrededor del segmento", () => {
    expect(parseProviderEventId("  bzzoiro:event:654311  ")).toBe(654311);
  });

  it("rechaza IDs de otros proveedores o mal formados", () => {
    expect(parseProviderEventId("mock:event:654311")).toBeNull();
    expect(parseProviderEventId("bzzoiro:event:abc")).toBeNull();
    expect(parseProviderEventId("bzzoiro:event:")).toBeNull();
    expect(parseProviderEventId("")).toBeNull();
  });

  it("no rompe con un segmento mal codificado", () => {
    expect(parseProviderEventId("bzzoiro%3Aevent%")).toBeNull();
  });
});
