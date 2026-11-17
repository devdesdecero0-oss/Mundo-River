import { cookies } from "next/headers";
import { isTheme, THEME_COOKIE, type Theme } from "@/lib/theme";

/**
 * Tema elegido por el usuario, guardado en cookie para que el servidor pueda
 * renderizar la clase correcta desde el primer byte. `null` = sin preferencia:
 * el script temprano resuelve el sistema operativo.
 */
export async function getRequestTheme(): Promise<Theme | null> {
  const store = await cookies();
  const value = store.get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : null;
}
