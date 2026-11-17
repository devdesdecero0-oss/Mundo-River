import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildNewsArticles, classifyNews, mentionsRiver, toNewsArticle } from "./articles";
import { parseRssFeed } from "./parser";

const fixturePath = fileURLToPath(
  new URL("./__fixtures__/google-news.xml", import.meta.url),
);
const xml = readFileSync(fixturePath, "utf8");

describe("RSS — parser", () => {
  const items = parseRssFeed(xml, "https://news.google.com/rss/search?q=River+Plate");

  it("lee el canal y devuelve los ítems del feed grabado", () => {
    expect(items).toHaveLength(12);
    expect(items[0]).toMatchObject({
      sourceName: expect.any(String),
      publishedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
    expect(items[0]?.link).toMatch(/^https:\/\/news\.google\.com\/rss\/articles\//);
  });

  it("quita el sufijo del medio del titular", () => {
    const item = items[0]!;
    expect(item.title.endsWith(` - ${item.sourceName}`)).toBe(false);
    expect(item.title.length).toBeGreaterThan(10);
  });

  it("genera una bajada propia cuando el feed no trae resumen", () => {
    expect(items[0]?.excerpt).toContain("nota original");
    expect(items[0]?.excerpt).toContain(items[0]!.sourceName);
  });

  it("omite ítems sin título o sin enlace válido", () => {
    const malformed = `<?xml version="1.0"?><rss><channel>
      <item><title>Sin enlace</title></item>
      <item><title></title><link>https://example.com/a</link></item>
      <item><title>Válido</title><link>https://example.com/b</link><pubDate>Fri, 13 Nov 2026 10:00:00 GMT</pubDate></item>
    </channel></rss>`;
    const parsed = parseRssFeed(malformed);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.title).toBe("Válido");
  });

  it("tolera XML roto sin lanzar", () => {
    expect(parseRssFeed("<rss><channel><item>")).toEqual([]);
  });
});

describe("RSS — filtro y clasificación", () => {
  it("detecta menciones de River sin falsos positivos evidentes", () => {
    expect(mentionsRiver("La Reserva de River empató")).toBe(true);
    expect(mentionsRiver("El Millonario ganó")).toBe(true);
    expect(mentionsRiver("Boca Juniors entrenó")).toBe(false);
  });

  it("clasifica notas de mercado, inferiores e institucional", () => {
    expect(classifyNews("River cerró el fichaje de un refuerzo", "")).toBe("mercado-de-pases");
    expect(classifyNews("La Reserva de River empató", "")).toBe("inferiores");
    expect(classifyNews("El Monumental tendrá nueva obra", "")).toBe("institucional");
    expect(classifyNews("River entrenó pensando en Lanús", "")).toBe("plantel-profesional");
  });

  it("descarta ítems que no mencionan a River y deduplica por título", () => {
    const items = parseRssFeed(`<?xml version="1.0"?><rss><channel>
      <item><title>River ganó - Uno</title><link>https://example.com/1</link><source>Uno</source><pubDate>Fri, 13 Nov 2026 10:00:00 GMT</pubDate></item>
      <item><title>River ganó - Dos</title><link>https://example.com/2</link><source>Dos</source><pubDate>Fri, 13 Nov 2026 11:00:00 GMT</pubDate></item>
      <item><title>Boca entrenó - Tres</title><link>https://example.com/3</link><source>Tres</source><pubDate>Fri, 13 Nov 2026 12:00:00 GMT</pubDate></item>
    </channel></rss>`);
    const articles = buildNewsArticles(items);
    expect(articles).toHaveLength(1);
    expect(articles[0]).toMatchObject({
      title: "River ganó",
      sourceName: "Dos",
      externalUrl: "https://example.com/2",
      body: [],
    });
  });

  it("asigna portada por categoría y enlace externo", () => {
    const [article] = buildNewsArticles(parseRssFeed(`<?xml version="1.0"?><rss><channel>
      <item><title>River sumó un refuerzo - Diario</title><link>https://example.com/9</link><source>Diario</source><pubDate>Fri, 13 Nov 2026 10:00:00 GMT</pubDate></item>
    </channel></rss>`));
    expect(article).toMatchObject({
      category: "mercado-de-pases",
      coverImage: "/images/news/mercado.svg",
      externalUrl: "https://example.com/9",
    });
  });

  it("mapea el feed real a artículos de agregador sin cuerpo", () => {
    const articles = buildNewsArticles(parseRssFeed(xml));
    expect(articles.length).toBeGreaterThan(8);
    expect(articles.every((article) => article.body.length === 0)).toBe(true);
    expect(articles.every((article) => article.externalUrl?.startsWith("https://"))).toBe(true);
    expect(new Set(articles.map((article) => article.slug)).size).toBe(articles.length);
  });

  it("usa la fecha del feed y no la fecha actual", () => {
    const article = toNewsArticle({
      title: "River Plate: novedad",
      link: "https://example.com/x",
      excerpt: "Bajada",
      publishedAt: "2026-11-12T15:24:24.000Z",
      sourceName: "Medio",
    });
    expect(article.publishedAt).toBe("2026-11-12T15:24:24.000Z");
  });
});
