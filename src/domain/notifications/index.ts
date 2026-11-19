import type { NewsArticle } from "@/domain/types";

export type NotificationStatus =
  | "unsupported"
  | "default"
  | "granted"
  | "denied"
  | "subscribed"
  | "ios"
  | "error";

export type NotificationErrorReason = "brave-settings" | "service-worker" | "subscription";

export function shouldShowNotificationControl(status: NotificationStatus): boolean {
  return status === "default" || status === "granted" || status === "error";
}

export function notificationErrorMessage(reason: NotificationErrorReason): string {
  switch (reason) {
    case "brave-settings":
      return "En Brave, permití notificaciones, desactivá Shields para este sitio y habilitá la mensajería Push.";
    case "service-worker":
      return "Actualizá la página y permití que el navegador ejecute el Service Worker.";
    case "subscription":
      return "No se pudo registrar este dispositivo. Revisá los permisos y volvé a intentar.";
  }
}

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
