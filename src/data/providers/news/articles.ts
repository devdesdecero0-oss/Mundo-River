import type { NewsArticle, NewsCategory } from "@/domain/types";
import { categoryLabel } from "@/domain/news";
import type { ParsedFeedItem } from "./parser";

const RIVER_PATTERN =
  /\b(river(?:\s+plate)?|millonario|monumental|gallardo|nunez|banda roja)\b/i;

const CATEGORY_PATTERNS: Array<{ category: NewsCategory; pattern: RegExp }> = [
  {
    category: "mercado-de-pases",
    pattern:
      /\b(mercado de pases|fichaje|fichar|refuerzo|traspaso|contratacion|contratar|cedido|prestamo|oferta|se va|vuelve|llega|incorpora)\b/i,
  },
  {
    category: "inferiores",
    pattern:
      /\b(reserva|inferiores|juvenil|juveniles|cantera|formativas|divisiones|sub ?\d{2}|promesa|proyeccion)\b/i,
  },
  {
    category: "institucional",
    pattern:
      /\b(institucional|dirigencia|presidente|comision directiva|estadio|monumental|socio|socios|sede|homenaje|aniversario|asamblea)\b/i,
  },
];

const COVER_BY_CATEGORY: Record<NewsCategory, string> = {
  "plantel-profesional": "/images/news/plantel.svg",
  inferiores: "/images/news/inferiores.svg",
  institucional: "/images/news/institucional.svg",
  "mercado-de-pases": "/images/news/mercado.svg",
};

export function mentionsRiver(...values: Array<string | undefined>): boolean {
  return values.some((value) => RIVER_PATTERN.test(value ?? ""));
}

export function classifyNews(title: string, excerpt: string): NewsCategory {
  const text = `${title} ${excerpt}`;
  for (const rule of CATEGORY_PATTERNS) {
    if (rule.pattern.test(text)) return rule.category;
  }
  return "plantel-profesional";
}

export function toNewsArticle(item: ParsedFeedItem): NewsArticle {
  const category = classifyNews(item.title, item.excerpt);
  return {
    id: `rss:${hash(item.link)}`,
    slug: buildSlug(item.title, item.link),
    title: item.title,
    excerpt: item.excerpt,
    body: [],
    category,
    tags: ["River Plate", categoryLabel(category)],
    author: item.sourceName,
    publishedAt: item.publishedAt,
    coverImage: item.imageUrl ?? COVER_BY_CATEGORY[category],
    externalUrl: item.link,
    sourceName: item.sourceName,
  };
}

export function buildNewsArticles(
  items: readonly ParsedFeedItem[],
  limit = 60,
): NewsArticle[] {
  const seen = new Set<string>();
  const articles: NewsArticle[] = [];

  const sorted = [...items].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  for (const item of sorted) {
    if (!mentionsRiver(item.title)) continue;
    const key = normalize(item.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    articles.push(toNewsArticle(item));
    if (articles.length >= limit) break;
  }

  return articles;
}

function buildSlug(title: string, link: string): string {
  const base = normalize(title)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72)
    .replace(/-+$/, "");
  return `${base || "nota"}-${hash(link).slice(0, 6)}`;
}

function hash(value: string): string {
  let result = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 0x01000193);
  }
  return (result >>> 0).toString(16).padStart(8, "0");
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
