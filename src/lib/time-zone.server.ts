import { cookies } from "next/headers";
import {
  FALLBACK_TIME_ZONE,
  isValidTimeZone,
  TIME_ZONE_COOKIE,
} from "@/lib/time-zone";

/**
 * Zona horaria para el render del servidor: cookie detectada en cliente
 * o el fallback de Buenos Aires (FR-005).
 *
 * Este módulo es exclusivo de Server Components. Los helpers usados por
 * el cliente viven en `lib/time-zone.ts` para no empaquetar `next/headers`.
 */
export async function getRequestTimeZone(): Promise<string> {
  const store = await cookies();
  const cookieValue = store.get(TIME_ZONE_COOKIE)?.value;
  return isValidTimeZone(cookieValue) ? cookieValue : FALLBACK_TIME_ZONE;
}
