import { XMLParser } from "fast-xml-parser";

/**
 * Parser tolerante de feeds RSS 2.0.
 *
 * Solo extrae titulares, enlace, fecha, fuente y una bajada corta. Nunca
 * descarga ni reproduce el cuerpo completo de la nota original.
 */

export interface ParsedFeedItem {
  title: string;
  link: string;
  excerpt: string;
  publishedAt: string;
  sourceName: string;
  sourceUrl?: string;
  imageUrl?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "#cdata",
  trimValues: true,
  processEntities: true,
});

export function parseRssFeed(xml: string, feedUrl = ""): ParsedFeedItem[] {
  let document: unknown;
  try {
    document = parser.parse(xml);
  } catch {
    return [];
  }

  const channel = getPath(document, ["rss", "channel"]);
  const rawItems = getPath(channel, ["item"]);
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  const parsed: ParsedFeedItem[] = [];
  for (const raw of items) {
    const item = toItem(raw, feedUrl);
    if (item) parsed.push(item);
  }
  return parsed;
}

function toItem(raw: unknown, feedUrl: string): ParsedFeedItem | null {
  const title = cleanText(readText(getPath(raw, ["title"])));
  const link = cleanText(readText(getPath(raw, ["link"]))) || attributeOf(getPath(raw, ["link"]), "href");
  if (!title || !link || !/^https?:\/\//i.test(link)) return null;

  const sourceNode = getPath(raw, ["source"]);
  const sourceName =
    cleanText(readText(sourceNode)) ||
    cleanText(readText(getPath(raw, ["author"]))) ||
    hostOf(feedUrl) ||
    "Fuente original";
  const sourceUrl = attributeOf(sourceNode, "url") || undefined;
  const cleanTitle = stripSourceSuffix(title, sourceName);

  const description = readText(getPath(raw, ["description"])) || readText(getPath(raw, ["summary"]));
  const excerpt = buildExcerpt(description, cleanTitle, sourceName);

  const publishedAt = readDate(
    readText(getPath(raw, ["pubDate"])) ||
      readText(getPath(raw, ["published"])) ||
      readText(getPath(raw, ["updated"])),
  );

  return {
    title: cleanTitle,
    link,
    excerpt,
    publishedAt,
    sourceName,
    ...(sourceUrl ? { sourceUrl } : {}),
    ...(readImage(raw) ? { imageUrl: readImage(raw) } : {}),
  };
}

function buildExcerpt(html: string, title: string, sourceName: string): string {
  const text = cleanText(decodeEntities(stripTags(html)));
  let excerpt = text;
  if (excerpt.startsWith(title)) excerpt = excerpt.slice(title.length).trim();
  if (sourceName && excerpt.endsWith(sourceName)) {
    excerpt = excerpt.slice(0, -sourceName.length).trim();
  }
  excerpt = excerpt.replace(/^[·\-–—\s]+/, "").trim();

  if (excerpt.length < 24 || normalize(excerpt) === normalize(title)) {
    return `Cobertura de ${sourceName} sobre River Plate. Abrí la nota original para leer el contenido completo.`;
  }
  return excerpt.length > 220 ? `${excerpt.slice(0, 217).trimEnd()}…` : excerpt;
}

function stripSourceSuffix(title: string, sourceName: string): string {
  if (!sourceName) return title;
  const suffix = ` - ${sourceName}`;
  if (title.endsWith(suffix)) return title.slice(0, -suffix.length).trim();
  return title;
}

function readImage(raw: unknown): string | undefined {
  const media = getPath(raw, ["media:content"]);
  const mediaUrl = attributeOf(media, "url");
  if (mediaUrl && /^https?:\/\//i.test(mediaUrl)) return mediaUrl;

  const thumbnail = getPath(raw, ["media:thumbnail"]);
  const thumbnailUrl = attributeOf(thumbnail, "url");
  if (thumbnailUrl && /^https?:\/\//i.test(thumbnailUrl)) return thumbnailUrl;

  const enclosure = getPath(raw, ["enclosure"]);
  const enclosureUrl = attributeOf(enclosure, "url");
  if (enclosureUrl && /^https?:\/\//i.test(enclosureUrl)) return enclosureUrl;

  const image = readText(getPath(raw, ["image"]));
  return image && /^https?:\/\//i.test(image) ? image : undefined;
}

function readDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function readText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("#cdata" in record) return readText(record["#cdata"]);
    if ("#text" in record) return readText(record["#text"]);
  }
  return "";
}

function attributeOf(value: unknown, name: string): string {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  const attribute = record[`@_${name}`];
  return typeof attribute === "string" ? attribute : "";
}

function getPath(value: unknown, path: readonly string[]): unknown {
  let current = value;
  for (const key of path) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, " ");
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
