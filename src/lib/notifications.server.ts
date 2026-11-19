import { createHash } from "node:crypto";
import { kv } from "@vercel/kv";
import type { PushSubscriptionPayload } from "@/domain/notifications";

export const PUSH_SUBSCRIPTIONS_SET = "mr:push:subscriptions";
export const NOTIFIED_NEWS_SET = "mr:notifications:news";
export const NOTIFICATIONS_INITIALIZED_KEY = "mr:notifications:initialized";
export const NOTIFICATIONS_PROCESS_LOCK = "mr:notifications:process-lock";

export function subscriptionKey(endpoint: string): string {
  return `mr:push:subscription:${createHash("sha256").update(endpoint).digest("hex")}`;
}

export async function savePushSubscription(subscription: PushSubscriptionPayload): Promise<void> {
  const key = subscriptionKey(subscription.endpoint);
  await kv.set(key, subscription);
  await kv.sadd(PUSH_SUBSCRIPTIONS_SET, key);
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const key = subscriptionKey(endpoint);
  await kv.del(key);
  await kv.srem(PUSH_SUBSCRIPTIONS_SET, key);
}
