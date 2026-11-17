---
feature: 004-pwa
documento: spec
estado: Aprobado
version: 1.0.0
fecha: 2026-11-16
---

# Especificación — PWA instalable

## Objetivo

Permitir que Mundo River se instale como aplicación en celulares y computadoras desde el navegador, abra en una ventana propia y siga siendo utilizable con conectividad intermitente, sin publicar en tiendas ni agregar dependencias externas.

## Alcance

- Manifest web servido por `src/app/manifest.ts` con nombre, colores, íconos, `display: "standalone"`, `start_url`, `scope` y atajos a Calendario y Novedades.
- Service worker propio en `public/sw.js` con:
  - precache del shell (`/`), `/offline`, manifest e íconos;
  - navegación network-first con copia de la última página visitada;
  - assets estáticos cache-first;
  - exclusión explícita de RSC, API, POST y recursos de otros orígenes.
- Registro del service worker únicamente en producción y solo si el navegador lo soporta.
- UI de instalación: botón compacto en el header de escritorio y entrada en el menú móvil. En iOS se muestran instrucciones manuales.
- Aviso “Actualizar” cuando hay una versión nueva, sin recarga automática.
- Aviso discreto “Sin conexión” con `aria-live`.
- Página `/offline` como fallback de navegación sin red.
- `SITE_URL` resuelve automáticamente la URL de producción de Vercel (`VERCEL_PROJECT_PRODUCTION_URL`) y permite `NEXT_PUBLIC_SITE_URL` como override explícito.
- íconos PNG 192/512, maskable 192/512 y Apple Touch 180 generados desde el escudo local.

## Fuera de alcance

- Publicación en Play Store o App Store; no se genera APK ni IPA.
- Notificaciones push, sincronización en segundo plano o Background Sync.
- Precarga completa de todas las secciones.
- Dependencias nuevas (`next-pwa`, Workbox, `sharp` o similares).
- Cambios en dominio, datos, proveedores, repositorios o contratos de partidos, jugadores y noticias.
- Edición offline: la app solo lee datos guardados.
- Modificaciones a `next.config.ts`, `tsconfig.json`, `vitest.config.ts` o `playwright.config.ts`.

## Requisitos funcionales

- **FR-001** El manifest se sirve en `/manifest.webmanifest` y declara `name` y `short_name` “Mundo River”, `display: "standalone"`, `start_url: "/"` y `scope: "/"`.
- **FR-002** El manifest incluye íconos 192×192 y 512×512, variantes `maskable` y atajos a `/calendario` y `/novedades`.
- **FR-003** La metadata del sitio enlaza el manifest, los íconos PNG y Apple Touch, y declara `appleWebApp`.
- **FR-004** El service worker se registra solo en producción y con scope `/`; si el registro falla, el sitio sigue funcionando igual.
- **FR-005** Sin conexión, una navegación a una ruta no visitada responde con `/offline`.
- **FR-006** Sin conexión, una navegación a una ruta visitada responde con la última copia guardada.
- **FR-007** Los assets de `/_next/static`, fuentes, íconos e imágenes se sirven desde caché cuando están disponibles.
- **FR-008** El service worker no intercepta ni cachea peticiones RSC, `/api/`, métodos distintos de `GET` ni recursos de otros orígenes.
- **FR-009** Cuando hay un service worker en espera, la UI muestra un aviso “Actualizar”; la recarga ocurre solo cuando la persona lo acepta.
- **FR-010** El aviso de actualización se puede descartar y no reaparece hasta la próxima versión.
- **FR-011** Con `navigator.onLine === false` se muestra un aviso discreto “Sin conexión” y se oculta al recuperar la red.
- **FR-012** El botón de instalación aparece solo si el navegador puede instalar o si es iOS; se oculta cuando la app ya corre en modo standalone.
- **FR-013** En iOS el botón abre instrucciones “Compartir → Añadir a pantalla de inicio”.
- **FR-014** El Match Center no refresca automáticamente ni por acción manual mientras no haya conexión.
- **FR-015** `SITE_URL` prioriza `NEXT_PUBLIC_SITE_URL`, luego `https://${VERCEL_PROJECT_PRODUCTION_URL}` y por último el placeholder local.
- **FR-016** Los íconos se regeneran con `pnpm generate:icons` a partir de `public/brand/river-crest.svg`.

## Requisitos no funcionales

- **NFR-001** La UI de instalación, actualización y offline respeta el tema claro/oscuro con tokens semánticos; no introduce superficies fijas nuevas.
- **NFR-002** Los avisos son accesibles: texto visible, `aria-live` donde corresponde y controles de al menos 44 px.
- **NFR-003** El service worker limita las páginas guardadas (~20) y elimina cachés de versiones anteriores al activarse.
- **NFR-004** La instalación requiere HTTPS; `localhost` es la excepción admitida para desarrollo.
- **NFR-005** No se guardan tokens, cookies de autenticación ni respuestas de API en la caché.
- **NFR-006** El primer render del servidor no depende de APIs del navegador; no hay errores de hidratación.

## Criterios de aceptación

- `https://<proyecto>.vercel.app/manifest.webmanifest` responde 200 con el contenido esperado.
- Chrome de escritorio y Android ofrecen instalar la app y la abren en ventana standalone.
- Safari de iOS permite “Añadir a pantalla de inicio” y la app abre sin barra del navegador.
- Sin conexión, la app abre el shell o `/offline` y mantiene la navegación interna disponible según la caché.
- Al publicar una versión nueva aparece “Actualizar” y la app no se recarga sola.
- `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build` y `pnpm test:e2e` pasan.
