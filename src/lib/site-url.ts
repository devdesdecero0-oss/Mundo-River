/**
 * URL pública canónica del sitio.
 *
 * Prioridad:
 * 1. `NEXT_PUBLIC_SITE_URL` (override explícito, por ejemplo un dominio propio).
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` (la detecta Vercel en cada deploy).
 * 3. Placeholder local mientras no haya dominio definitivo.
 */
export const SITE_URL_FALLBACK = "https://mundoriver.example.com";

const PROTOCOL_WITH_SLASHES = /^[a-z][a-z0-9+.-]*:\/\//i;
const SCHEME_WITHOUT_SLASHES = /^[a-z][a-z0-9+.-]*:/i;
const HOST_WITH_PORT = /^[a-z][a-z0-9+.-]*:\d+(\/|$)/i;

/**
 * Normaliza una URL: agrega `https://` cuando falta, descarta protocolos
 * inseguros y elimina query, hash y barras finales.
 */
export function normalizeSiteUrl(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  let candidate = trimmed;
  if (!PROTOCOL_WITH_SLASHES.test(trimmed)) {
    // Un esquema sin `//` solo es válido si en realidad es host:puerto.
    if (SCHEME_WITHOUT_SLASHES.test(trimmed) && !HOST_WITH_PORT.test(trimmed)) return null;
    candidate = `https://${trimmed}`;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!url.hostname) return null;

  const path = url.pathname.replace(/\/+$/, "");
  return `${url.origin}${path}`;
}

/** Resuelve la URL pública a partir de las variables de entorno del servidor. */
export function resolveSiteUrl(env: Record<string, string | undefined>): string {
  const explicit = normalizeSiteUrl(env.NEXT_PUBLIC_SITE_URL);
  if (explicit) return explicit;

  const vercel = normalizeSiteUrl(env.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercel) return vercel;

  return SITE_URL_FALLBACK;
}
