import { resolveSiteUrl } from "@/lib/site-url";

/**
 * URL pública del sitio calculada en el servidor.
 *
 * Vive separada de `navigation.ts` para que las variables de entorno del
 * servidor (`VERCEL_PROJECT_PRODUCTION_URL`) no lleguen al bundle cliente:
 * `site-header` y `site-footer` solo importan constantes seguras.
 */
export const SITE_URL = resolveSiteUrl(process.env);
