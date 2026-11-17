/**
 * Genera los íconos de la PWA a partir de `public/brand/river-crest.svg`.
 *
 * Usa el Chromium de Playwright que ya es devDependency: no agrega paquetes
 * ni requiere un servidor levantado. Ejecutar con `pnpm generate:icons`.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = resolve(root, "public", "brand", "river-crest.svg");
const outputDir = resolve(root, "public", "icons");
const BACKGROUND = "#0b0b0e";

/** `crest` es la altura del escudo como fracción del lado del ícono. */
const jobs = [
  { file: "icon-192.png", size: 192, crest: 0.68 },
  { file: "icon-512.png", size: 512, crest: 0.68 },
  { file: "maskable-192.png", size: 192, crest: 0.5 },
  { file: "maskable-512.png", size: 512, crest: 0.5 },
  { file: "apple-touch-icon.png", size: 180, crest: 0.66 },
];

function readPngSize(buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") throw new Error("El archivo generado no es un PNG");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const svg = await readFile(svgPath, "utf8");
const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
try {
  for (const job of jobs) {
    const crestHeight = Math.round(job.size * job.crest);
    const page = await browser.newPage({
      viewport: { width: job.size, height: job.size },
      deviceScaleFactor: 1,
    });

    await page.setContent(
      `<!doctype html>
      <html>
        <body style="margin:0;width:${job.size}px;height:${job.size}px;background:${BACKGROUND};display:flex;align-items:center;justify-content:center;overflow:hidden">
          <img src="${dataUri}" alt="" style="height:${crestHeight}px;width:auto;display:block" />
        </body>
      </html>`,
      { waitUntil: "load" },
    );

    await page.waitForFunction(() => {
      const image = document.querySelector("img");
      return Boolean(image && image.complete && image.naturalWidth > 0);
    });

    const buffer = await page.screenshot({
      clip: { x: 0, y: 0, width: job.size, height: job.size },
    });
    await page.close();

    const size = readPngSize(buffer);
    if (size.width !== job.size || size.height !== job.size) {
      throw new Error(
        `${job.file}: se esperaba ${job.size}×${job.size} y se generó ${size.width}×${size.height}`,
      );
    }

    await writeFile(resolve(outputDir, job.file), buffer);
    console.log(`✓ public/icons/${job.file} (${size.width}×${size.height})`);
  }
} finally {
  await browser.close();
}
