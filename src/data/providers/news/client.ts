import type { NewsArticle } from "@/domain/types";
import { buildNewsArticles } from "./articles";
import { parseRssFeed } from "./parser";

const DEFAULT_TIMEOUT_MS = 8_000;
const CACHE_TTL = 5 * 60_000;

export class NewsProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NewsProviderError";
  }
}

export interface NewsFeedClientOptions {
  feeds: string[];
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  revalidate?: number;
}

/** Cliente de feeds RSS con timeout, caché corta y tolerancia a feeds caídos. */
export class NewsFeedClient {
  private readonly feeds: string[];
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly revalidate: number;
  private cache: { at: number; articles: NewsArticle[] } | null = null;
  private pending: Promise<NewsArticle[]> | null = null;

  constructor(options: NewsFeedClientOptions) {
    this.feeds = [...new Set(options.feeds.filter((feed) => /^https?:\/\//i.test(feed)))];
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.revalidate = options.revalidate ?? 300;
  }

  async listArticles(): Promise<NewsArticle[]> {
    if (this.cache && Date.now() - this.cache.at < CACHE_TTL) {
      return this.cache.articles;
    }
    if (this.pending) return this.pending;

    this.pending = this.fetchAll()
      .then((articles) => {
        this.cache = { at: Date.now(), articles };
        return articles;
      })
      .finally(() => {
        this.pending = null;
      });

    return this.pending;
  }

  private async fetchAll(): Promise<NewsArticle[]> {
    if (this.feeds.length === 0) {
      throw new NewsProviderError("No hay feeds de noticias configurados.");
    }

    const results = await Promise.allSettled(
      this.feeds.map(async (feed) => {
        const response = await this.fetchImpl(feed, {
          headers: {
            Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.5",
            "User-Agent": "MundoRiver/0.1 (+lector RSS)",
          },
          signal: AbortSignal.timeout(this.timeoutMs),
          next: { revalidate: this.revalidate, tags: ["news"] },
        } as RequestInit & { next: { revalidate: number; tags: string[] } });

        if (!response.ok) {
          throw new NewsProviderError(`El feed respondió con estado ${response.status}.`);
        }
        return parseRssFeed(await response.text(), feed);
      }),
    );

    const items = results.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    );

    if (items.length === 0) {
      throw new NewsProviderError("Ningún feed devolvió noticias válidas.");
    }

    return buildNewsArticles(items);
  }
}
