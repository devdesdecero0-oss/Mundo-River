import * as webpush from "web-push";
import { NextResponse } from "next/server";
import { notificationKey } from "@/domain/notifications";
import { newsRepository } from "@/data/repositories";
import type { DataSourceAware } from "@/data/repositories";
import { readServerEnv } from "@/lib/env";
import {
  deletePushSubscription,
  NOTIFIED_NEWS_SET,
  NOTIFICATIONS_INITIALIZED_KEY,
  PUSH_SUBSCRIPTIONS_SET,
} from "@/lib/notifications.server";
import type { PushSubscriptionPayload } from "@/domain/notifications";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const env = readServerEnv();
  const authorization = request.headers.get("authorization");
  if (!env.cronSecret || authorization !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!env.vapidPublicKey || !env.vapidPrivateKey || !env.vapidSubject) {
    return NextResponse.json({ error: "Falta configuración VAPID." }, { status: 503 });
  }

  try {
    webpush.setVapidDetails(env.vapidSubject, env.vapidPublicKey, env.vapidPrivateKey);
    const articles = await newsRepository.listArticles();
    const sourceAware = newsRepository as typeof newsRepository & Partial<DataSourceAware>;
    if (sourceAware.getDataSource && sourceAware.getDataSource() !== "live") {
      return NextResponse.json({ ok: true, sent: 0, reason: "fuente-no-live" });
    }

    const existingKeys = new Set(
      ((await kv.smembers(NOTIFIED_NEWS_SET)) as string[] | null) ?? [],
    );
    const currentKeys = articles.map(notificationKey);

    if (!(await kv.get<boolean>(NOTIFICATIONS_INITIALIZED_KEY))) {
      for (const key of currentKeys) await kv.sadd(NOTIFIED_NEWS_SET, key);
      await kv.set(NOTIFICATIONS_INITIALIZED_KEY, true);
      return NextResponse.json({ ok: true, sent: 0, initialized: true });
    }

    const fresh = articles.filter((article) => !existingKeys.has(notificationKey(article)));
    if (fresh.length === 0) return NextResponse.json({ ok: true, sent: 0 });

    const subscriptionKeys =
      ((await kv.smembers(PUSH_SUBSCRIPTIONS_SET)) as string[] | null) ?? [];
    const subscriptions = (
      await Promise.all(
        subscriptionKeys.map(async (key) => ({
          key,
          subscription: await kv.get<PushSubscriptionPayload>(key),
        })),
      )
    ).filter(
      (item): item is { key: string; subscription: PushSubscriptionPayload } =>
        item.subscription !== null,
    );

    let sent = 0;
    for (const article of fresh) {
      const payload = JSON.stringify({
        title: article.title,
        body: article.sourceName ?? "Nueva novedad de River",
        url: `/novedades/${article.slug}`,
      });

      for (const item of subscriptions) {
        try {
          await webpush.sendNotification(item.subscription, payload);
          sent += 1;
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await deletePushSubscription(item.subscription.endpoint);
          }
        }
      }
      await kv.sadd(NOTIFIED_NEWS_SET, notificationKey(article));
    }

    return NextResponse.json({ ok: true, sent, articles: fresh.length });
  } catch {
    return NextResponse.json({ error: "No se pudieron procesar las novedades." }, { status: 503 });
  }
}
