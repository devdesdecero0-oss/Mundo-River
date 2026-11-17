# MEMORY.md — Mundo River
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- v2 con datos reales: partidos, plantel, estadísticas y calificaciones desde Bzzoiro Sports Data; noticias desde Google News RSS.
- Modo oscuro integral con toggle en el header, cookie `mr_theme`, respeto de `prefers-color-scheme` y sincronización entre pestañas.
- Home, Calendario, Match Center y Temporada consumen repositorios live con fallback a mock.
- PWA instalable con manifest, service worker propio, offline, aviso de actualización e instalación guiada en iOS.
- Deploy en producción: https://mundo-river.vercel.app (proyecto `devdesdecero0/mundo-river`); manifest, SW y offline verificados sobre la URL pública.
- Suite: 192 tests unitarios y 26 E2E en verde; lint, typecheck y build limpios.
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

## Próximos pasos
- Cargar `BZZOIRO_TOKEN` y `NEWS_FEEDS` en Vercel (Settings → Environment Variables) y redeployar; sin token el sitio usa mock.
- Repo GitHub publicado: https://github.com/devdesdecero0-oss/Mundo-River.git, rama `main`, commit inicial `1f607b4`.
- E2E corre en modo mock vía `playwright.config.ts`; no requiere variables externas.
- Evaluar T122 (`pnpm data:snapshot`) y T123 (aviso no bloqueante de fallback) si se priorizan.
