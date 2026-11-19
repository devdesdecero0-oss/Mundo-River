/** Detecta si la app corre en una ventana instalada (standalone). */
export function isStandalone(displayModeStandalone: boolean, navigatorStandalone: boolean): boolean {
  return displayModeStandalone || navigatorStandalone;
}

/**
 * Detecta iPhone, iPad e iPod. iPadOS moderno se presenta como MacIntel y
 * solo se distingue por la cantidad de puntos táctiles.
 */
export function isIosDevice(
  userAgent: string,
  platform: string,
  maxTouchPoints: number,
): boolean {
  if (/iphone|ipad|ipod/i.test(userAgent)) return true;
  return /macintel|macintosh/i.test(platform) && maxTouchPoints > 1;
}

/** Detecta Brave sin depender de que el navegador incluya su marca en el UA. */
export function isBraveBrowser(userAgent: string, hasBraveApi: boolean): boolean {
  return hasBraveApi || /\bBrave\//i.test(userAgent);
}

export type InstallMode = "installed" | "prompt" | "ios" | "none";

/**
 * Decide qué UI de instalación mostrar:
 * - `installed`: ya corre instalada, no se ofrece nada.
 * - `prompt`: el navegador expuso `beforeinstallprompt`.
 * - `ios`: Safari iOS no expone prompt, se muestran instrucciones manuales.
 * - `none`: navegador sin soporte, no se muestra botón.
 */
export function resolveInstallMode({
  installed,
  canPrompt,
  ios,
}: {
  installed: boolean;
  canPrompt: boolean;
  ios: boolean;
}): InstallMode {
  if (installed) return "installed";
  if (canPrompt) return "prompt";
  if (ios) return "ios";
  return "none";
}

/** El service worker se registra solo en producción y con soporte del navegador. */
export function shouldRegisterServiceWorker(
  nodeEnv: string | undefined,
  hasServiceWorker: boolean,
): boolean {
  return nodeEnv === "production" && hasServiceWorker;
}
