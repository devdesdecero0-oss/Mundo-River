export const FALLBACK_TIME_ZONE = "America/Argentina/Buenos_Aires";
export const TIME_ZONE_COOKIE = "mr_tz";

export function isValidTimeZone(timeZone: string | undefined | null): timeZone is string {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function detectBrowserTimeZone(): string {
  if (typeof window === "undefined") return FALLBACK_TIME_ZONE;
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isValidTimeZone(detected) ? detected : FALLBACK_TIME_ZONE;
}

export function persistTimeZone(timeZone: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(
    timeZone,
  )}; path=/; max-age=31536000; samesite=lax`;
}
