import { z } from "zod";

/**
 * Variables de entorno del servidor.
 *
 * Este módulo se importa únicamente desde repositorios y clientes server-side.
 * Nunca debe llegar al bundle del cliente: el token de Bzzoiro no se expone.
 */

export type DataMode = "mock" | "live";

export const DEFAULT_NEWS_FEEDS = [
  "https://news.google.com/rss/search?q=River+Plate&hl=es-419&gl=AR&ceid=AR:es-419",
] as const;

const envSchema = z.object({
  BZZOIRO_TOKEN: z.string().trim().min(1, "BZZOIRO_TOKEN no puede estar vacío").optional(),
  DATA_MODE: z.enum(["mock", "live"], {
    errorMap: () => ({ message: "DATA_MODE debe ser 'mock' o 'live'" }),
  }).optional(),
  NEWS_FEEDS: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().trim().optional(),
  VAPID_PRIVATE_KEY: z.string().trim().optional(),
  VAPID_SUBJECT: z.string().trim().url().optional(),
  CRON_SECRET: z.string().trim().optional(),
});

export interface ServerEnv {
  dataMode: DataMode;
  bzzoiroToken: string | null;
  newsFeeds: string[];
  vapidPublicKey: string | null;
  vapidPrivateKey: string | null;
  vapidSubject: string | null;
  cronSecret: string | null;
}

type EnvSource = Record<string, string | undefined>;

/**
 * Lee y valida la configuración del servidor.
 *
 * - `DATA_MODE` explícito manda.
 * - Sin `DATA_MODE`, se usa `live` si hay token y `mock` si no.
 * - `NEWS_FEEDS` acepta una lista separada por comas o saltos de línea.
 */
export function readServerEnv(source: EnvSource = process.env): ServerEnv {
  const parsed = envSchema.safeParse({
    BZZOIRO_TOKEN: normalize(source.BZZOIRO_TOKEN),
    DATA_MODE: normalize(source.DATA_MODE)?.toLowerCase(),
    NEWS_FEEDS: normalize(source.NEWS_FEEDS),
    VAPID_PUBLIC_KEY: normalize(source.VAPID_PUBLIC_KEY),
    VAPID_PRIVATE_KEY: normalize(source.VAPID_PRIVATE_KEY),
    VAPID_SUBJECT: normalize(source.VAPID_SUBJECT),
    CRON_SECRET: normalize(source.CRON_SECRET),
  });

  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Configuración de entorno inválida: ${detail}`);
  }

  const token = parsed.data.BZZOIRO_TOKEN ?? null;
  const dataMode: DataMode = parsed.data.DATA_MODE ?? (token ? "live" : "mock");
  const feeds = parseFeeds(parsed.data.NEWS_FEEDS);

  return {
    dataMode,
    bzzoiroToken: token,
    newsFeeds: feeds.length > 0 ? feeds : [...DEFAULT_NEWS_FEEDS],
    vapidPublicKey: parsed.data.VAPID_PUBLIC_KEY ?? null,
    vapidPrivateKey: parsed.data.VAPID_PRIVATE_KEY ?? null,
    vapidSubject: parsed.data.VAPID_SUBJECT ?? null,
    cronSecret: parsed.data.CRON_SECRET ?? null,
  };
}

/** Indica si un modo live puede operar (token presente). */
export function canUseLiveProvider(env: ServerEnv): boolean {
  return env.dataMode === "live" && Boolean(env.bzzoiroToken);
}

function normalize(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseFeeds(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,\n]/)
    .map((feed) => feed.trim())
    .filter((feed) => /^https?:\/\//i.test(feed));
}
