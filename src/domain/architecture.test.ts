import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(path);
    if (!entry.name.endsWith(".ts") || entry.name.endsWith(".test.ts")) return [];
    return [path];
  });
}

const domainFiles = listSourceFiles(join(process.cwd(), "src", "domain"));

describe("arquitectura del dominio", () => {
  it("encuentra los módulos de dominio esperados", () => {
    expect(domainFiles.length).toBeGreaterThan(0);
  });

  it("no accede a la red ni importa proveedores o repositorios", () => {
    for (const file of domainFiles) {
      const source = readFileSync(file, "utf8");
      expect(source, `${file} usa fetch`).not.toMatch(/\bfetch\s*\(/);
      expect(source, `${file} importa infraestructura`).not.toMatch(
        /from\s+["'][^"']*(data\/(providers|repositories)|node:(http|https|net))[^"']*["']/,
      );
    }
  });
});
