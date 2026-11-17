# Mundo River

Centro de información y Match Center para hinchas de River Plate, construido con **Next.js 15 (App Router)**, **TypeScript strict** y **Tailwind CSS v4**. Los datos deportivos se obtienen en vivo de **Bzzoiro Sports Data** y las noticias de feeds **RSS**, siempre detrás de repositorios intercambiables con un modo mock para tests y desarrollo sin red.

## Funcionalidades

- **Novedades** (`/novedades`): titulares reales de Google News RSS con fuente, fecha y enlace externo; búsqueda sin acentos, filtros sincronizados con la URL, paginación y notas relacionadas. No se copia el cuerpo de las notas.
- **Calendario** (`/calendario`): partidos reales de la temporada, vista de mes y agenda, filtros por competición, mes y estado, partido en vivo destacado, estados vacíos y navegación por teclado.
- **Liga Profesional** (`/liga-profesional`): tabla anual calculada con las fases regulares y tabla oficial del grupo de River, con puntos, posiciones, goles y forma.
- **Match Center** (`/partidos/[id]`): 5 pestañas accesibles (Resumen, Incidencias, Estadísticas, Formaciones, Calificaciones), previa con countdown, H2H, estadísticas comparativas, MVP, notas individuales, auto-refresh cada 30 s y enlaces directos con `?tab=`. Usa estado, minuto, formaciones y calificaciones reales del proveedor.
- **Temporada** (`/temporada`): goleador y asistente, top 5 de cada ranking con barras proporcionales, registro, efectividad, racha, últimos 5, local/visitante y panel del jugador sin abandonar la página. Se alimenta de las estadísticas reales por jugador y se recalcula al filtrar por competición.
- **Tema claro/oscuro**: toggle accesible en el header, persistencia en cookie `mr_theme`, respeto de `prefers-color-scheme` en la primera visita sin parpadeo y sincronización entre pestañas con `BroadcastChannel`.
- **PWA instalable**: manifest, service worker propio, instalación en celular y computadora, aviso de actualización, página `/offline` y aviso “Sin conexión”. Requiere HTTPS (o `localhost`). No hay notificaciones push ni publicación en tiendas.
- **Transversal**: zonas horarias del usuario, responsive desde 360 px, accesibilidad AA, skeletons, error boundary, 404, sitemap, robots y JSON-LD.

## Comandos

```bash
pnpm install          # instalar dependencias
pnpm dev              # desarrollo en http://localhost:3000
pnpm build            # build de producción
pnpm start            # servir el build
pnpm lint             # ESLint (Next.js)
pnpm typecheck        # TypeScript sin emitir
pnpm test             # tests unitarios (Vitest)
pnpm test:coverage    # cobertura de src/domain
pnpm test:e2e         # E2E con Playwright (Chromium + viewport móvil)
pnpm generate:icons   # regenera los íconos de la PWA desde el escudo
```

Para E2E por primera vez:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

El `webServer` de Playwright compila y sirve la app en el puerto `3100`; si ya hay un servidor en ese puerto, lo reutiliza.

## Arquitectura

```text
src/
  app/                 # rutas, layouts, metadata, loading/error/404, sitemap, robots
  components/          # UI por dominio: match, calendar, season, news, layout, ui
  domain/              # lógica pura y testeable (sin React, Next, red ni storage)
    time/              # fechas locales con Intl + timeZone explícito
    matches/           # estados, minutos, filtros, orden, H2H
    stats/             # rankings, registro, forma, splits, ratings, comparativas
    news/              # lectura, filtros, orden, paginación, relacionadas
    squad/             # normalización y validación del proveedor de plantel
    types.ts           # contratos de dominio
  data/
    fixtures/          # datos mock tipados (fallback y tests)
    providers/         # adaptadores de proveedores: bzzoiro (API) y news (RSS)
    repositories/      # contrato + implementaciones mock y live, selector por DATA_MODE
  lib/                 # navegación, tema claro/oscuro, PWA, URL pública, timezone de servidor/cliente, entorno validado con Zod
  test-utils/          # builders para tests
e2e/                   # flujos críticos con Playwright
scripts/               # generador de íconos de la PWA
public/sw.js           # service worker (caché, offline y actualización)
public/icons/          # íconos 192/512, maskable y Apple Touch
```

### Reglas de dominio

- Toda conversión instante → calendario usa `Intl.DateTimeFormat` con `timeZone` explícito. No se usan `toISOString().slice(0,10)`, `getDate()`, `getMonth()` ni `getDay()` para fechas locales.
- El servidor renderiza con la cookie `mr_tz` o `America/Argentina/Buenos_Aires` como fallback. El cliente detecta la zona real, la persiste y repinta sin recargar.
- Fechas visibles con `es-AR`; claves internas de día `AAAA-MM-DD` y de mes `AAAA-MM`.
- Rankings y totales de temporada se derivan de los mismos eventos y estadísticas que alimentan las fichas de partido (consistencia SC-007).

### Tema claro/oscuro

- La preferencia vive en la cookie `mr_theme` (`light` o `dark`, un año de vigencia). Sin cookie, el sitio sigue `prefers-color-scheme`.
- El servidor aplica la clase `dark` en `<html>` y un script `beforeInteractive` resuelve la cookie o el sistema antes del primer pintado, sin destello ni mismatch de hidratación.
- `ThemeProvider` mantiene el estado, persiste la elección, escucha cambios del sistema solo mientras no haya preferencia manual y sincroniza otras pestañas con `BroadcastChannel`.
- Las superficies usan tokens semánticos (`paper`, `surface`, `inverse`, `strong`, `on-strong`, `on-light`, `river-ink`, `warning-*`, `alert-*`). No se usan `bg-white`/`bg-black` para superficies conmutables.
- El rojo de relleno no cambia; el rojo de texto usa `river-ink` (`#ff5c73` en oscuro) para conservar contraste AA. `color-scheme` y `theme-color` acompañan al tema activo.
- `ThemeProvider` y `ThemeToggle` están en `src/components/providers/theme-provider.tsx` y `src/components/ui/theme-toggle.tsx`; la lógica pura en `src/lib/theme.ts` con tests en `src/lib/theme.test.ts`.

### PWA e instalación

- El manifest vive en `src/app/manifest.ts` y se sirve como `/manifest.webmanifest`: nombre “Mundo River”, `display: standalone`, colores `#0b0b0e`, íconos 192/512 con variantes `maskable` y atajos a Calendario y Novedades.
- `public/sw.js` es la única fuente de caché: navegación network-first con copia de la última página visitada, assets cache-first y fallback a `/offline`. No intercepta RSC, `/api/`, POST ni otros orígenes. Al cambiar las reglas hay que subir `CACHE_VERSION`.
- El service worker se registra solo en producción; si falla, el sitio funciona igual. La instalación requiere HTTPS (`localhost` es la excepción), así que en la red local por `http://192.168.x.x` no habrá service worker.
- Instalación: botón compacto en el header de escritorio y entrada en el menú móvil. Safari iOS no expone `beforeinstallprompt`, por eso muestra instrucciones “Compartir → Añadir a pantalla de inicio”.
- Actualizaciones: cuando hay un worker en espera aparece “Hay una versión nueva”; la recarga solo ocurre al pulsar “Actualizar”. El Match Center no refresca solo si no hay conexión.
- Los íconos se generan desde `public/brand/river-crest.svg` con `pnpm generate:icons` (usa el Chromium de Playwright, sin dependencias nuevas).
- `SITE_URL` se resuelve en `src/lib/site-url.ts`: `NEXT_PUBLIC_SITE_URL` → `https://${VERCEL_PROJECT_PRODUCTION_URL}` → placeholder local. Vive en `src/lib/site.server.ts` para no filtrar variables de servidor al cliente.

### Deploy en Vercel

Sitio en producción: **https://mundo-river.vercel.app** (proyecto `devdesdecero0/mundo-river`).

```bash
pnpm dlx vercel login    # dispositivo: abrir el enlace que imprime la CLI
pnpm dlx vercel          # preview
pnpm dlx vercel --prod   # producción en https://mundo-river.vercel.app
```

Sin `BZZOIRO_TOKEN` la app arranca en modo `mock`; las variables reales se configuran después en el panel de Vercel. El deploy no necesita repositorio en GitHub. `.vercelignore` excluye `.env.local`, artefactos de build y pruebas.

No usar `vercel deploy --temporary` en Windows: el builder local crea enlaces simbólicos y falla con `EPERM`. Con sesión iniciada, Vercel compila en la nube.

### Datos reales y modo mock

- `.env.local` define `BZZOIRO_TOKEN` (solo servidor) y opcionalmente `DATA_MODE=live|mock` y `NEWS_FEEDS`. Sin `DATA_MODE`, el default es `live`.
- `src/data/repositories/index.ts` elige las implementaciones live o mock. Los tests unitarios y los E2E usan `DATA_MODE=mock` para no depender de la red.
- Los repositorios live cachean por recurso: 20 s para partido en vivo/detalle, 5 min para listas y noticias, 1 h para partido finalizado y estadísticas, 6 h para plantel y ligas, 24 h para estadios.
- Si el proveedor falla, el repositorio cae al fixture mock correspondiente y registra el problema en el servidor; la UI sigue funcionando.
- El token nunca se envía al cliente: el adaptador Bzzoiro solo se importa desde el servidor.
- Los partidos usan IDs canónicos `bzzoiro:event:<id>`, los jugadores `bzzoiro:<player_id>` y las demás selecciones `bzzoiro:team:<id>`; River conserva el ID `river`.
- El plantel real puede traer dorsales duplicados; la normalización descarta duplicados y deja constancia en consola.
- Bzzoiro no publica hoy Copa Argentina ni Trofeo de Campeones: esos encuentros aparecen recién cuando el proveedor los incluye.
- Los escudos de rivales se representan con colores e iniciales; el escudo de River es un placeholder local y el sitio aclara que es no oficial.

### Noticias RSS

- Los feeds se parsean con `fast-xml-parser`, se filtran por River, se deduplican por enlace y se clasifican por categoría.
- Cada nota muestra titular, bajada, fuente y fecha, y enlaza al artículo original. El detalle no reproduce el cuerpo completo.

## Accesibilidad y SEO

- Skip link, landmarks, foco visible, áreas táctiles de 44 px, tabs con roles ARIA y navegación por flechas/Home/End.
- Los estados no dependen solo del color: badges con texto, etiquetas accesibles en barras y anuncios `aria-live="polite"` para el partido en vivo.
- Respeta `prefers-reduced-motion`.
- Metadatos únicos por ruta, canonical, Open Graph/Twitter, JSON-LD (`NewsArticle`, `SportsEvent`, `BreadcrumbList`, `CollectionPage`), `sitemap.xml` y `robots.txt`.

## Tests

- **192 tests unitarios** con Vitest (fechas, estados, filtros, rankings, registro, noticias, plantel, mappers de proveedor, parser RSS, entorno, tema, PWA, URL pública, manifest y arquitectura).
- **26 E2E** en Chromium y viewport móvil: home, filtros de novedades, calendario/agenda, pestañas del Match Center, filtro de temporada + panel de jugador, 404, alternancia/persistencia del tema oscuro, ficha de nota en oscuro, manifest, service worker, fallback offline y flujo de instalación iOS. Requieren `DATA_MODE=mock`.

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```
