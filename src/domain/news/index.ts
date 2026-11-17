import type { NewsArticle, NewsBlock, NewsCategory } from "@/domain/types";

export const NEWS_CATEGORIES: ReadonlyArray<{ id: NewsCategory; label: string; slug: string }> = [
  { id: "plantel-profesional", label: "Plantel Profesional", slug: "plantel-profesional" },
  { id: "inferiores", label: "Inferiores", slug: "inferiores" },
  { id: "institucional", label: "Institucional", slug: "institucional" },
  { id: "mercado-de-pases", label: "Mercado de Pases", slug: "mercado-de-pases" },
];

const WORDS_PER_MINUTE = 200;

/** R-NEWS — Tiempo de lectura: `max(1, ceil(palabras/200))`. */
export function computeReadingTime(body: readonly NewsBlock[] | string): number {
  const blocks = typeof body === "string" ? [{ type: "paragraph" as const, text: body }] : body;
  const text = blocks
    .filter((block) => block.type !== "image")
    .map((block) => block.text ?? "")
    .join(" ")
    .replace(/<[^>]*>/g, " ")
    .trim();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/** Normaliza texto para búsquedas sin distinguir mayúsculas ni acentos. */
export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export interface NewsFilters {
  category?: NewsCategory | "all";
  query?: string;
}

/** R-NEWS — Filtra por categoría y búsqueda en título, extracto y etiquetas. */
export function filterNews(
  articles: readonly NewsArticle[],
  filters: NewsFilters = {},
): NewsArticle[] {
  const query = filters.query ? normalizeSearchText(filters.query) : "";

  return articles.filter((article) => {
    if (filters.category && filters.category !== "all" && article.category !== filters.category) {
      return false;
    }
    if (!query) return true;
    const haystack = normalizeSearchText(
      [article.title, article.excerpt, ...article.tags].join(" "),
    );
    return haystack.includes(query);
  });
}

/** R-NEWS — Orden cronológico descendente, desempate estable por id. */
export function sortNews(articles: readonly NewsArticle[]): NewsArticle[] {
  return [...articles].sort((a, b) => {
    const diff = new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  });
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

/** R-NEWS — Paginación sin duplicados (la página siempre es sobre la lista completa). */
export function paginate<T>(items: readonly T[], page: number, pageSize: number): Page<T> {
  const safePage = Math.max(1, Math.floor(page));
  const safeSize = Math.max(1, Math.floor(pageSize));
  const start = (safePage - 1) * safeSize;
  const window = items.slice(start, start + safeSize);
  return {
    items: window,
    page: safePage,
    pageSize: safeSize,
    total: items.length,
    hasMore: start + window.length < items.length,
  };
}

/** Conteos por categoría derivados de los datos disponibles. */
export function countNewsByCategory(
  articles: readonly NewsArticle[],
): Record<NewsCategory | "all", number> {
  const counts: Record<NewsCategory | "all", number> = {
    all: articles.length,
    "plantel-profesional": 0,
    inferiores: 0,
    institucional: 0,
    "mercado-de-pases": 0,
  };
  for (const article of articles) counts[article.category] += 1;
  return counts;
}

/** Relacionadas: misma categoría, luego etiquetas compartidas, sin incluir la actual. */
export function getRelatedArticles(
  articles: readonly NewsArticle[],
  current: NewsArticle,
  limit = 3,
): NewsArticle[] {
  const pool = articles.filter((article) => article.id !== current.id);
  const tags = new Set(current.tags);

  return [...pool]
    .map((article) => {
      const sharedTags = article.tags.filter((tag) => tags.has(tag)).length;
      const score = (article.category === current.category ? 2 : 0) + sharedTags;
      return { article, score };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.article.publishedAt).getTime() - new Date(a.article.publishedAt).getTime(),
    )
    .slice(0, limit)
    .map(({ article }) => article);
}

export function categoryLabel(category: NewsCategory): string {
  return NEWS_CATEGORIES.find((item) => item.id === category)?.label ?? category;
}

export function categorySlug(category: NewsCategory): string {
  return NEWS_CATEGORIES.find((item) => item.id === category)?.slug ?? category;
}

export function categoryFromSlug(slug: string | undefined | null): NewsCategory | "all" {
  if (!slug) return "all";
  return NEWS_CATEGORIES.find((item) => item.slug === slug)?.id ?? "all";
}
