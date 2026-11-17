---
feature: 004-pwa
documento: plan
estado: Aprobado
version: 1.0.0
fecha: 2026-11-16
---

# Plan técnico — PWA instalable

## Estrategia

1. **Manifest nativo de Next.js** en `src/app/manifest.ts`; Next lo publica como `/manifest.webmanifest` y agrega el `<link rel="manifest">` automáticamente.
2. **Service worker estático** en `public/sw.js`, sin bundler ni dependencias. Se registra desde un provider cliente solo en producción.
3. **Lógica pura testeable** en `src/lib/pwa.ts` (detección de iOS, standalone, modo de instalación y registro) y `src/lib/site-url.ts` (resolución de la URL pública).
4. **UI cliente** con contexto: `PwaProvider` + botón de instalación + aviso de actualización + aviso offline.
5. **Fallback offline** con `/offline` precacheado y copia de las últimas páginas visitadas.
6. **Íconos** generados con el Chromium de Playwright desde el SVG del escudo, sin `sharp` ni paquetes nuevos.

## Cachés y estrategias

| Tipo de request | Estrategia | Caché |
|---|---|---|
| Navegación (`request.mode === "navigate"`) | Red primero; guarda copia y cae a caché; si no hay nada, `/offline` | `pages` |
| `/_next/static`, fuentes, `icons`, `images`, `brand` | Caché primero; si falta, red y guarda | `assets` |
| Manifest, `/offline`, `/` al instalar | Precache | `shell` |
| RSC (`?_rsc=` o header `RSC`), `/api/`, POST y cross-origin | Sin intercepción | — |

- `CACHE_VERSION` se sube al cambiar estrategias; `activate` borra las cachés con otro prefijo.
- Las páginas guardadas se recortan a ~20 entradas para acotar el almacenamiento.
- Las respuestas no exitosas (`opaque`, `!response.ok`) no se guardan.
- `clients.claim()` permite controlar pestañas ya abiertas sin recargar.

## Actualización

1. `registration.update()` se consulta al volver a la pestaña y al registrar.
2. Si aparece un worker `waiting` (o uno nuevo pasa a `installed` con controlador existente), el provider marca `updateAvailable`.
3. La persona pulsa “Actualizar” → `postMessage({ type: "SKIP_WAITING" })` → `controllerchange` → `location.reload()` una sola vez.
4. En la primera instalación no hay controlador: nunca se muestra el aviso ni se recarga.

## Instalación

- `beforeinstallprompt` se captura con `preventDefault()` y se guarda el evento.
- `resolveInstallMode` decide qué mostrar: `installed`, `prompt`, `ios` o `none`.
- `appinstalled` oculta el botón.
- iOS: `isIosDevice` detecta iPhone/iPad y iPadOS (`MacIntel` + `maxTouchPoints > 1`); se abre un diálogo con los pasos manuales.
- En iOS y navegadores sin prompt, los íconos también funcionan: no hay botón roto.

## URL pública

`resolveSiteUrl(env)` es una función pura:

1. `NEXT_PUBLIC_SITE_URL` válida (normaliza protocolo y quita slash final).
2. `VERCEL_PROJECT_PRODUCTION_URL` → `https://<host>`.
3. `https://mundoriver.example.com`.

`SITE_URL` se expone desde `src/lib/site.server.ts` para no arrastrar variables de servidor al bundle cliente. `navigation.ts` conserva solo constantes seguras (`NAV_ITEMS`, `SITE_NAME`, `SITE_DESCRIPTION`).

## Archivos

| Archivo | Cambio |
|---|---|
| `src/lib/pwa.ts` / `pwa.test.ts` | Detección de plataforma y modo de instalación. |
| `src/lib/site-url.ts` / `site-url.test.ts` | Resolución pura de la URL pública. |
| `src/lib/site.server.ts` | `SITE_URL` calculada en servidor. |
| `src/lib/navigation.ts` | Deja de exportar `SITE_URL`. |
| `src/app/manifest.ts` / `manifest.test.ts` | Manifest tipado y su test. |
| `src/components/providers/pwa-provider.tsx` | Registro, eventos y estado de la PWA. |
| `src/components/ui/install-app-button.tsx` | Botón e instrucciones iOS. |
| `src/components/ui/update-banner.tsx` | Aviso de nueva versión. |
| `src/components/ui/offline-banner.tsx` | Aviso sin conexión. |
| `src/app/offline/page.tsx` | Pantalla de fallback. |
| `public/sw.js` | Service worker. |
| `scripts/generate-icons.mjs` | Generador reproducible de íconos. |
| `public/icons/*.png` | Íconos 192/512, maskable y Apple Touch. |
| `src/app/layout.tsx` | Manifest, íconos, `appleWebApp`, `viewportFit` y provider. |
| `src/components/layout/site-header.tsx` | Accesos de instalación. |
| `src/components/match/match-center.tsx` | Sin refresco automático offline. |
| `src/app/robots.ts` | `/offline` fuera del índice. |
| `package.json` | Script `generate:icons`. |
| `e2e/pwa.spec.ts` | Manifest, servicio, offline e iOS. |

## Riesgos y mitigaciones

- **SW sirviendo HTML viejo con otro tema** → el script temprano de `theme.ts` reaplica la cookie.
- **Caché de RSC rompe la navegación** → nunca se intercepta; si el fetch falla, Next cae a navegación completa y el SW responde `/offline`.
- **Conflicto entre aviso offline y de actualización** → posiciones distintas y z-index controlado.
- **Registro en `pnpm dev`** → se omite fuera de producción.
- **`sw.js` cacheado por el navegador** → Next sirve `public/` con `max-age=0`; subir `CACHE_VERSION` al cambiar la lógica.
- **Íconos desactualizados** → el script es la única fuente y se ejecuta a mano al cambiar el escudo.
- **Peso de la caché** → límite de páginas y limpieza por versión.

## Pruebas

- Unitarias: `pwa.ts`, `site-url.ts` y manifest.
- E2E: manifest 200 y enlace, registro y scope del SW, fallback `/offline` con contexto offline, aviso sin conexión y flujo iOS.
- Manual: instalación en Chrome escritorio, Android y Safari iOS; apertura standalone; tema y navegación offline.
- Deploy: `pnpm dlx vercel login` (manual), `pnpm dlx vercel`, `pnpm dlx vercel --prod`; verificar manifest, SW e instalación en la URL `*.vercel.app`.
