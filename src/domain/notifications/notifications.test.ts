import { describe, expect, it } from "vitest";
import { isPushSubscriptionPayload, notificationKey, selectUnnotifiedArticles } from "@/domain/notifications";
import type { NewsArticle } from "@/domain/types";

const article: NewsArticle = {
  id: "rss:1",
  slug: "river-gana-abc123",
  title: "River gana",
  excerpt: "Una novedad.",
  body: [],
  category: "plantel-profesional",
  tags: ["River Plate"],
  author: "Fuente",
  publishedAt: "2026-11-18T10:00:00.000Z",
  coverImage: "/images/news/plantel.svg",
  externalUrl: "https://example.com/river-gana",
  sourceName: "Fuente",
};

describe("notificaciones de novedades", () => {
  it("usa el enlace original como clave estable", () => {
    expect(notificationKey(article)).toBe("https://example.com/river-gana");
  });

  it("selecciona solo novedades no notificadas", () => {
    expect(selectUnnotifiedArticles([article], new Set())).toEqual([article]);
    expect(selectUnnotifiedArticles([article], new Set([notificationKey(article)]))).toEqual([]);
  });

  it("valida una suscripción Push", () => {
    expect(
      isPushSubscriptionPayload({
        endpoint: "https://push.example.test/subscription",
        keys: { p256dh: "key", auth: "auth" },
      }),
    ).toBe(true);
    expect(isPushSubscriptionPayload({ endpoint: "http://inseguro", keys: {} })).toBe(false);
  });
});
