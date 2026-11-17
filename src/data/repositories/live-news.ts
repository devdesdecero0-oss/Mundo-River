import type { NewsArticle } from "@/domain/types";
import type {
  DataSource,
  DataSourceAware,
  NewsRepository,
} from "./contracts";
import { MockNewsRepository } from "./mock";
import { DEFAULT_NEWS_FEEDS } from "@/lib/env";
import { NewsFeedClient } from "@/data/providers/news/client";

export interface RssNewsRepositoryOptions {
  feeds?: readonly string[];
  client?: NewsFeedClient;
}

/** Repositorio de noticias basado en titulares RSS con enlace a la fuente. */
export class RssNewsRepository implements NewsRepository, DataSourceAware {
  private readonly client: NewsFeedClient;
  private readonly mock = new MockNewsRepository();
  private source: DataSource = "live";

  constructor(options: RssNewsRepositoryOptions = {}) {
    this.client =
      options.client ??
      new NewsFeedClient({
        feeds: options.feeds ? [...options.feeds] : [...DEFAULT_NEWS_FEEDS],
      });
  }

  getDataSource(): DataSource {
    return this.source;
  }

  async listArticles(): Promise<NewsArticle[]> {
    try {
      const articles = await this.client.listArticles();
      if (articles.length === 0) throw new Error("Sin artículos");
      this.source = "live";
      return articles;
    } catch {
      this.source = "fallback";
      return this.mock.listArticles();
    }
  }

  async getArticleBySlug(slug: string): Promise<NewsArticle | null> {
    const articles = await this.listArticles();
    return articles.find((article) => article.slug === slug) ?? null;
  }
}
