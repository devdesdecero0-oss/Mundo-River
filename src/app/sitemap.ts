import type { MetadataRoute } from "next";
import { matchesRepository, newsRepository } from "@/data/repositories";
import { SITE_URL } from "@/lib/site.server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, matches] = await Promise.all([
    newsRepository.listArticles(),
    matchesRepository.listMatches(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/novedades`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/calendario`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/temporada`, changeFrequency: "weekly", priority: 0.8 },
  ];

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/novedades/${article.slug}`,
    lastModified: article.updatedAt ?? article.publishedAt,
    changeFrequency: "weekly",
    priority: article.featured ? 0.8 : 0.7,
  }));

  const matchRoutes: MetadataRoute.Sitemap = matches.map((match) => ({
    url: `${SITE_URL}/partidos/${match.id}`,
    lastModified: match.finishedAt ?? match.kickoffAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleRoutes, ...matchRoutes];
}
