import type { NewsArticle } from "@/domain/types";

export interface PushSubscriptionPayload {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function notificationKey(article: Pick<NewsArticle, "externalUrl" | "id">): string {
  return article.externalUrl?.trim() || article.id;
}

export function selectUnnotifiedArticles(
  articles: readonly NewsArticle[],
  notifiedKeys: ReadonlySet<string>,
): NewsArticle[] {
  return articles.filter((article) => !notifiedKeys.has(notificationKey(article)));
}

export function isPushSubscriptionPayload(value: unknown): value is PushSubscriptionPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  const keys = candidate.keys;
  if (!keys || typeof keys !== "object") return false;
  const pushKeys = keys as Record<string, unknown>;
  return (
    typeof candidate.endpoint === "string" &&
    /^https:\/\//i.test(candidate.endpoint) &&
    typeof pushKeys.p256dh === "string" &&
    typeof pushKeys.auth === "string"
  );
}
