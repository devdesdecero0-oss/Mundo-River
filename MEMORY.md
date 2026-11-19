# MEMORY.md — Mundo River
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- v2 con datos reales: partidos, plantel, estadísticas y calificaciones desde Bzzoiro Sports Data; noticias desde Google News RSS.
- Modo oscuro integral con toggle en el header, cookie `mr_theme`, respeto de `prefers-color-scheme` y sincronización entre pestañas.
- Home, Calendario, Match Center y Temporada consumen repositorios live con fallback a mock.
- PWA instalable con manifest, service worker propio, offline, aviso de actualización e instalación guiada en iOS.
- Deploy en producción: https://mundo-river.vercel.app (proyecto `devdesdecero0/mundo-river`); manifest, SW y offline verificados sobre la URL pública.
- Vercel Production tiene `BZZOIRO_TOKEN` y `DATA_MODE=live` como secretos; la producción fue redeployada y verificada con noticias RSS actuales y partidos reales.
- Liga Profesional: `/liga-profesional` muestra tabla anual de fases regulares y grupo oficial de River desde Bzzoiro (`/leagues/85/standings/`); la tabla anual pagina todos los eventos de la liga y excluye playoffs.
- Producción verificada: tabla anual con 30 equipos y River en 7.º con 55 puntos; grupo detectado automáticamente como `Clausura, Grupo B`.
- Calendario: las fechas y partidos abren un panel contextual con todos los encuentros del día; la selección se refleja en `?partido=<id>`, respetando estados, sede, hora local, resultado, motivo y minuto en vivo.
- Calendario: cambiar de mes sincroniza la URL con History API en lugar de `router.replace`, evitando navegación server-side y la recarga visual; la selección del partido usa estado local sincronizado con `?partido=`.
- Plantel: `/plantel` muestra el plantel vigente completo con puntaje sobre 10; suma notas válidas y divide por los partidos oficiales finalizados de River, con `SC` al final y enlaces a sus Match Center evaluados.
- Plantel: los partidos evaluados de cada jugador se muestran del más reciente al más antiguo según `kickoffAt`.
- Plantel: cada actuación muestra la ronda como `Fecha N` y el cruce completo (`River Plate vs rival` o `rival vs River Plate`) con su resultado.
- Amistosos: los eventos de Bzzoiro con competición `friendly` se registran y muestran, pero quedan excluidos de puntajes, promedios, partidos evaluados y demás números del plantel.
- Notificaciones: Push explícito para novedades, suscripciones en Vercel KV, procesamiento por GitHub Actions cada 5 minutos y deduplicación por enlace original; requiere `VAPID_PUBLIC_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET` y credenciales KV.
- Tema claro: superficies blancas, texto primario rojo oscuro legible, controles activos rojos y estados finalizados grises; el modo oscuro conserva sus tokens actuales.
- Suite: 214 tests unitarios y 36 E2E en verde; lint, typecheck y build limpios.
- Detalle real validado: `/partidos/bzzoiro:event:654311` (River vs Lanús, 22/11/2026) muestra previa, formaciones y calificaciones.

## Decisiones
- `DATA_MODE=live|mock` en `src/data/repositories/index.ts`; default `live`, tests/E2E usan `mock`.
- Token `BZZOIRO_TOKEN` solo en servidor (`.env.local`); nunca se envía al cliente.
- IDs canónicos: River `river`, rivales `bzzoiro:team:<id>`, partidos `bzzoiro:event:<id>`, jugadores `bzzoiro:<player_id>`, competiciones `bzzoiro:<league_id>-<season_id>`.
- `providerStatus`/`providerMinute` mandan sobre el reloj en `deriveMatchStatus`/`computeMatchMinute`.
- Los ratings del proveedor se usan tal cual (1–10, un decimal); fuera de rango o `null` → `SC`.
- Caché: vivo 20 s, listas/noticias 5 min, finalizado/estadísticas 1 h, plantel/ligas 6 h, estadios 24 h.
- Noticias RSS son solo agregador: titular, bajada, fuente y enlace externo; sin copiar el cuerpo.
- El Match Center selecciona explícitamente la formación de River (`selectLineupForTeam`).
- Copa Argentina y Trofeo de Campeones no están en Bzzoiro: brecha conocida hasta que el proveedor los publique.
- Tema: preferencia solo en cookie `mr_theme`; sin cookie resuelve el sistema. Script `beforeInteractive` + `suppressHydrationWarning` evitan FOUC.
- Tema: `ink` es texto y se invierte en oscuro; `inverse` es superficie siempre oscura; `strong`/`on-strong` son controles que se invierten; `on-light` es texto fijo oscuro sobre blanco/oro.
- Tema: el rojo de relleno (`bg-river`) no cambia; el rojo de texto usa `river-ink` (`#ff5c73` en oscuro) para AA.
- Tema: estados aplazado/suspendido usan `warning-*`/`alert-*`; loading, error, 404 y skeletons incluidos.
- PWA: manifest en `src/app/manifest.ts` + `public/sw.js` propio, sin `next-pwa` ni Workbox; registro solo en producción.
- PWA: navegación network-first (últimas 20 páginas), assets cache-first, y RSC/`/api/`/POST/cross-origin fuera de la caché.
- PWA: el fallback redirige a `/offline` (no sirve su HTML en otra URL) y precachea los chunks que referencia el HTML.
- PWA: actualización con aviso “Actualizar” + `SKIP_WAITING`; nunca recarga automática. iOS usa instrucciones manuales.
- PWA: `public/sw.js` muestra Push con título/fuente y abre la URL de la novedad; `CACHE_VERSION` quedó en `v2`.
- `SITE_URL`: `NEXT_PUBLIC_SITE_URL` → `https://${VERCEL_PROJECT_PRODUCTION_URL}` → placeholder; solo en `src/lib/site.server.ts`.

## Aprendizajes y errores a evitar
- Next.js entrega los params de ruta percent-encoded (`bzzoiro%3Aevent%3A…`): decodificar con `decodeURIComponent` antes del regex (test en `live.test.ts`).
- No usar `toISOString().slice(0,10)` para fechas locales; siempre `Intl` con `timeZone` explícito.
- El plantel real trae dorsales duplicados: normalizar y descartar duplicados, no asumir unicidad.
- Filtrar `player-stats` por `team_id === 755` y minutos > 0 para no mezclar suplentes ni rivales.
- PowerShell 5.1 no soporta `&&` y muestra acentos como mojibake aunque los archivos sean UTF-8.
- No hacer reemplazos masivos de clases con `-replace` y `$1` en PowerShell: expande mal y rompe JSX; usar script Node y verificar con grep.
- En oscuro, una superficie fija `bg-white` con texto heredado de `ink` queda en 1.12:1. Migrar siempre a `bg-surface`; sobre blanco fijo usar colores fijos (`on-light`, `river`), no `river-dark`.
- Opacidades `text-white/35–45` y `text-ink-muted/50` no llegan a AA sobre negro; usar mínimo `/60` en inverse y `/80` en paper/surface.
- Servir el HTML de `/offline` bajo otra URL hace que Next muestre `loading.tsx` al reconciliar la ruta: usar redirección 302.
- Sin los chunks de la ruta en caché, la hidratación falla offline: parsear `/_next/static/...` del HTML y cachearlos.
- Instalar la PWA requiere HTTPS; `http://192.168.x.x` no registra service worker (`localhost` es la excepción).
- `vercel deploy --temporary` falla en Windows (EPERM al crear symlinks del builder local); con login, `vercel --prod` compila en la nube y funciona.
- `vercel login <email>` está deprecado: el flujo actual es dispositivo (`https://vercel.com/oauth/device?user_code=...`).
- `isFinishedMatch` también debe reconocer `providerStatus === "finished"`; Bzzoiro no siempre envía `statusOverride` ni `finishedAt`.
- No ejecutar `pnpm build` y Playwright en paralelo: ambos usan `.next` y pueden corromper el artefacto de compilación.
- En Next App Router, `router.replace` para filtros locales vuelve a ejecutar la página server-side; para el calendario usar History API y mantener estado local cuando `useSearchParams` no se actualiza inmediatamente.
- El puntaje del plantel usa la escala de dominio 1–10 y redondea a un decimal; una nota ausente no suma, pero el partido finalizado sí cuenta en el divisor.
- La paleta clara se ajusta desde tokens en `globals.css`; no cambiar `inverse` ni los overrides `.dark` al retocar colores claros.
- Para cada preguntas que nesecites, pasamelo en formato multiple choice

## Próximos pasos
- `NEWS_FEEDS` no es necesario por ahora: usa el feed Google News predeterminado; se puede sobrescribir en Vercel si se agregan fuentes.
- Repo GitHub publicado: https://github.com/devdesdecero0-oss/Mundo-River.git, rama `main`, commit inicial `1f607b4`.
- E2E corre en modo mock vía `playwright.config.ts`; no requiere variables externas.
- Evaluar T122 (`pnpm data:snapshot`) y T123 (aviso no bloqueante de fallback) si se priorizan.
