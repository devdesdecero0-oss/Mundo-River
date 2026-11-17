export const THEME_COOKIE = "mr_theme";
export const THEME_CHANNEL = "mr_theme";
export const THEME_COLORS = {
  light: "#f6f4ef",
  dark: "#0b0b0e",
} as const;

export type Theme = keyof typeof THEME_COLORS;

export function isTheme(value: string | null | undefined): value is Theme {
  return value === "light" || value === "dark";
}

/** La preferencia guardada manda; sin cookie se sigue al sistema operativo. */
export function resolveTheme(
  stored: string | null | undefined,
  prefersDark: boolean,
): Theme {
  if (isTheme(stored)) return stored;
  return prefersDark ? "dark" : "light";
}

export function nextTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

/** Mensajes de sincronización entre pestañas; cualquier payload inválido se ignora. */
export function parseThemeMessage(message: unknown): Theme | null {
  if (typeof message !== "object" || message === null) return null;
  const { type, value } = message as { type?: unknown; value?: unknown };
  if (type !== "theme" || typeof value !== "string" || !isTheme(value)) return null;
  return value;
}

export function readDocumentTheme(): Theme | null {
  if (typeof document === "undefined") return null;
  const value = document.documentElement.dataset.theme;
  return isTheme(value) ? value : null;
}

export function persistTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.removeAttribute("media");
    meta.setAttribute("content", THEME_COLORS[theme]);
  });
}

/**
 * Script que corre antes del primer pintado: resuelve cookie o sistema y aplica
 * la clase para evitar el destello del tema incorrecto.
 */
export function getThemeInitScript(): string {
  return [
    "(function(){",
    "try{",
    `var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]+)/);`,
    "var t=m?decodeURIComponent(m[1]):null;",
    'if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}',
    "var r=document.documentElement;",
    'r.classList.toggle("dark",t==="dark");',
    "r.dataset.theme=t;",
    "r.style.colorScheme=t;",
    'var metas=document.querySelectorAll(\'meta[name="theme-color"]\');',
    `for(var i=0;i<metas.length;i++){metas[i].removeAttribute("media");metas[i].setAttribute("content",t==="dark"?"${THEME_COLORS.dark}":"${THEME_COLORS.light}");}`,
    "}catch(e){}",
    "})();",
  ].join("");
}
