---
feature: 001-river-app
documento: tasks
estado: Draft (deriva de plan.md v0.2.0)
version: 0.2.0
fecha: 2026-11-11
metodologia: TDD — test primero, implementación después
---

# Tareas — Mundo River v1

> **Reglas de ejecución**
> 1. Cada tarea se cierra con tests en verde y sin warnings nuevos.
> 2. Orden TDD: escribir el test que falla → implementación mínima → refactor.
> 3. `[P]` = paralelizable con otras tareas de la misma fase.
> 4. Un PR por fase, salvo F6/F7 que se dividen en 2.
> 5. Ninguna tarea de UI puede comenzar antes de que exista su función de dominio (F1).
> 6. Los tests del proveedor usan payloads grabados: **cero llamadas de red en CI**.
> 7. El escudo oficial no se modifica: solo se optimiza el archivo y se define su contenedor.

**Leyenda de estado:** `[ ]` pendiente · `[x]` hecho · `[~]` en curso

---

## Fase 0 — Bootstrap y tooling (0,5 d)

- [ ] **T001** Inicializar Next.js 15 con App Router, `src/`, TS strict, Tailwind v4, alias `@/*`.
- [ ] **T002** Configurar pnpm y scripts: `dev`, `lint`, `typecheck`, `test`, `test:coverage`, `e2e`, `build`, `squad:snapshot`.
- [ ] **T003** Instalar y configurar Vitest (proyectos `domain` node y `components` jsdom) + setup de Testing Library.
- [ ] **T004** Instalar y configurar Playwright (Chromium + WebKit, viewports 390×844 y 1280×800).
- [ ] **T005** Instalar shadcn/ui y los primitives base (button, badge, tabs, dialog, skeleton, input, select).
- [ ] **T006** Crear tokens de diseño (colores, tipografía, radios, sombras, dark mode) en `globals.css` + `tailwind.config.ts`.
- [ ] **T007** Configurar ESLint con `eslint-plugin-boundaries` (regla de capas de `plan.md §3`).
- [ ] **T008** Crear workflow de CI (lint → typecheck → test → build → e2e).
- [ ] **T009** Crear `src/lib/env.ts` (validación Zod de `SQUAD_*`, `CRON_SECRET`) y `src/lib/constants.ts` (rutas, tamaños de página, ventana live).
- [ ] **T010** Verificar pipeline vacío en verde y documentar comandos en el README raíz.

**Checkpoint F0:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build` en verde.

---

## Fase 1 — Dominio puro (2 d)

### 1.1 Tiempo y zona horaria

- [ ] **T011** Definir `src/domain/types.ts` (entidades de `spec.md §9`, incluida la plantilla).
- [ ] **T012** Test matrix de `toLocalDateKey` con 4 zonas y los 4 casos de `spec.md §8.1`.
- [ ] **T013** Implementar `toLocalDateKey`, `getMonthKey`, `isSameLocalDay` usando `Intl` + `formatToParts`.
- [ ] **T014** Test de `formatLocalDateTime`, `formatLocalDayHeader` (Hoy/Mañana/fecha larga) y `formatLocalTime`.
- [ ] **T015** Implementar los formateadores anteriores con locale `es-AR` y `timeZone` obligatorio.
- [ ] **T016** Implementar `groupByLocalDate` y `groupMatchesByLocalDate` con orden estable.
- [ ] **T017** Test de arquitectura: prohibir `toISOString().slice(0,10)`, `getDate()`, `getMonth()`, `getDay()`, `toLocaleDateString()` sin `timeZone`.
- [ ] **T018** Test de pureza: `src/domain/**` sin imports de React, Next, `node:*`, `fs` ni `fetch`.

### 1.2 Estado y filtros de partidos

- [ ] **T019** Test de `deriveMatchStatus`: scheduled, kickoff exacto, live, halftime, finished derivado, overrides y ventana 120/150 min.
- [ ] **T020** Implementar `deriveMatchStatus` con `statusOverride` prioritario.
- [ ] **T021** Test de `computeMatchMinute` (1H, entretiempo, 2H, descuento, alargue, fuera de vivo).
- [ ] **T022** Implementar `computeMatchMinute`.
- [ ] **T023** Test de `filterMatches` (competición, mes local, estado, combinaciones, inmutabilidad) y `sortMatches` (asc/desc, desempate por id).
- [ ] **T024** Implementar `filterMatches`, `sortMatches`, `getNextMatch`, `getLastResult`.
- [ ] **T025** Test e implementación de `computeHeadToHead` (victorias/empates/derrotas/goles).

### 1.3 Estadísticas y rankings

- [ ] **T026** Test de `computeScorers`: gol, penal, autogol excluido, empate y desempates R-RANK.
- [ ] **T027** Implementar `computeScorers` y `computeAssists` con `isTied`.
- [ ] **T028** Test de `computeSeasonRecord`, `computeForm` y `computeSplit` (sin partidos, solo finalizados, efectividad de liga vs copa).
- [ ] **T029** Implementar `computeSeasonRecord`, `computeForm`, `computeSplit`.
- [ ] **T030** Test de `selectMvp` y `averageTeamRating` (notas nulas, empate, redondeo a 1 decimal).
- [ ] **T031** Implementar `selectMvp` y `averageTeamRating`.

### 1.4 Novedades

- [ ] **T032** Test de `computeReadingTime` (cuerpo vacío, imágenes excluidas, mínimo 1 min).
- [ ] **T033** Implementar `computeReadingTime`, `sortNews`, `filterNews` (acentos/mayúsculas) y `paginate` (sin duplicados, `hasMore`).
- [ ] **T034** Test de consistencia de fixtures: goles de fichas = goles del ranking de goleadores (SC-007).

### 1.5 Plantel (normalización pura)

- [ ] **T035** Test de `normalizeSquadPayload`: payload de referencia → IDs canónicos, dorsales, posiciones y orden.
- [ ] **T036** Implementar `mapProviderPlayer`, `normalizeSquadPayload` y `resolveSquadPlayer`.
- [ ] **T037** Test de `validateSquad`: campos faltantes, posición desconocida, dorsal duplicado, payload vacío, idempotencia.
- [ ] **T038** Implementar `validateSquad` con warnings tipados (`MISSING_FIELD`, `DUPLICATE_NUMBER`, `UNKNOWN_POSITION`, `EMPTY_PAYLOAD`).

**Checkpoint F1:** cobertura de ramas ≥ 95 % en `src/domain/**`; 0 dependencias prohibidas.

---

## Fase 2 — Datos, contratos y repositorios mock (1 d)

- [ ] **T039** Crear esquemas Zod: `Competition`, `Season`, `Team`, `Player`, `SquadMembership`, `Match`, `MatchEvent`, `Lineup`, `PlayerMatchStats`, `NewsArticle`.
- [ ] **T040** Crear fixtures: 1 temporada 2026, 3 competiciones (Liga, Copa Argentina, Libertadores), 14 partidos en los 3 estados, 24 jugadores, 8 noticias (2 por categoría), 1 partido suspendido y 1 aplazado.
- [ ] **T041** Crear builders de test (`buildMatch`, `buildEvent`, `buildPlayer`, `buildNews`, `buildSquadPayload`) con overrides tipados.
- [ ] **T042** Implementar `MockNewsRepository`, `MockMatchRepository` y `MockSeasonRepository` validando con Zod.
- [ ] **T043** Implementar escenario de demo: `NEXT_PUBLIC_MOCK_NOW` y `?demo=live|halftime|finished`.
- [ ] **T044** Casos de uso `getNewsFeed`, `getNewsArticle`, `getSeasonMatches`, `getMatchCenter`, `getSeasonSummary`.
- [ ] **T045** Tests de contrato: todos los fixtures parsean y cumplen invariantes (score ↔ eventos, titulares = 11, plantel referenciado).

**Checkpoint F2:** repositorios intercambiables y fixtures válidos; sin acceso directo a JSON desde componentes.

---

## Fase 2B — Proveedor de plantel (1 d)

> Se ejecuta después de F2. No requiere el proveedor elegido para avanzar: se trabaja contra payloads grabados.

- [ ] **T046** Definir `SquadProviderPort` y `RawSquadPayload` / `ProviderPlayerDTO` (contrato de frontera documentado).
- [ ] **T047** Crear payloads grabados en `tests/providers/`: respuesta feliz, jugador incompleto, dorsal duplicado, 429, 500, timeout y JSON inválido.
- [ ] **T048** Implementar `ProviderSquadRepository` con `fetch` server-side, timeout de 5 s y 3 reintentos con backoff + jitter.
- [ ] **T049** Implementar single-flight (promesa compartida por clave) para evitar llamadas concurrentes.
- [ ] **T050** Integrar caché con tag `squad` (`revalidate: SQUAD_REVALIDATE_SECONDS`, default 21600).
- [ ] **T051** Implementar `Route Handler` `/api/cron/sync-squad` protegido con `CRON_SECRET` → `revalidateTag('squad')`.
- [ ] **T052** Implementar snapshot de respaldo (`src/infrastructure/snapshots/squad.snapshot.json`) + lectura *stale-on-error* con warning.
- [ ] **T053** Implementar `scripts/generate-squad-snapshot.ts` y comando `pnpm squad:snapshot`.
- [ ] **T054** Crear adaptador de referencia `api-football.adapter.ts` (mapeo de campos documentado; sin key en tests).
- [ ] **T055** Tests de integración: éxito, timeout, 429, 500, JSON inválido y payload vacío → snapshot; verificar warnings.
- [ ] **T056** Test de arquitectura `no-provider-secrets`: la key no aparece en código cliente ni en componentes.
- [ ] **T057** Documentar en README el proveedor, variables de entorno, mapeo de IDs y rotación de snapshot.

**Checkpoint F2B:** la plantilla se sirve desde caché/snapshot sin exponer secretos y el CI no hace llamadas externas.

---

## Fase 3 — Shell, marca, diseño y Home (1,5 d)

- [ ] **T058** Layout raíz: header con navegación (Inicio, Novedades, Calendario, Temporada), footer, contenedor y skip-link.
- [ ] **T059** Implementar `TimezoneSync` (cookie `mr_tz`) y `LocalDate` con el patrón de `plan.md §6.2`.
- [ ] **T060** Test de `LocalDate`: primer render = fallback SSR, actualización tras detectar TZ, sin error de hidratación.
- [ ] **T061** Implementar `ClubCrest` con escudo oficial: SVG/PNG, tamaños 24–96 px, `aspect-ratio`, `alt` configurable y fallback monocromático en `onError`.
- [ ] **T062** Tests de `ClubCrest`: fallback, `alt` decorativo vs descriptivo, relación de aspecto intacta y sin CLS.
- [ ] **T063** Implementar `EmptyState`, `ErrorState`, `Skeleton` y `PageHeader` reutilizables.
- [ ] **T064** Home: hero con próximo partido (o último resultado), últimos 4 artículos, tarjetas de goleador/asistente y CTA al calendario.
- [ ] **T065** Estados `loading.tsx`, `error.tsx` y `not-found.tsx` globales.
- [ ] **T066** Metadata base, Open Graph por defecto, favicon derivado del escudo y `theme-color`.
- [ ] **T067** Revisión responsive 360/390/768/1280 + navegación por teclado del header y foco visible.

**Checkpoint F3:** Home navegable con escudo oficial, sin warnings de hidratación, navegación completa por teclado.

---

## Fase 4 — Novedades (1,5 d)

- [ ] **T068** Componente `NewsCard` con imagen optimizada, categoría, fecha local y tiempo de lectura.
- [ ] **T069** Componente `NewsFilters` (chips accesibles) con sincronización de `?cat=` y anuncio a lectores de pantalla.
- [ ] **T070** Página `/novedades`: feed, conteos por categoría, estado vacío y paginación «Cargar más».
- [ ] **T071** Página `/novedades/[slug]` con cuerpo enriquecido, autor, fecha, relacionados y JSON-LD `NewsArticle`.
- [ ] **T072** `generateMetadata` y `generateStaticParams` para artículos.
- [ ] **T073** Tests de componentes: filtro, vacío, paginación sin duplicados.
- [ ] **T074** E2E: filtrar Inferiores → URL → abrir artículo → relacionados.

**Checkpoint F4:** US-01 completa y E2E en verde.

---

## Fase 5 — Calendario (1,5 d)

- [ ] **T075** Componente `MatchStatusBadge` (color + texto + ícono + `aria-label`).
- [ ] **T076** Componente `CompetitionFilter` derivado de datos, con «Todas» y sincronización de URL.
- [ ] **T077** `MonthGrid`: grilla mensual con indicadores por día y navegación accesible.
- [ ] **T078** `AgendaList`: agrupación por fecha local, destacado del partido en vivo y tarjetas de partido.
- [ ] **T079** Página `/calendario`: conmutador Mes/Agenda, filtros combinables, estados vacíos y preservación de filtros al navegar meses.
- [ ] **T080** Tests de componentes: filtros combinados, estado vacío, badge accesible.
- [ ] **T081** E2E: cambio a Agenda → filtro por competición → abrir partido; verificación de fecha local con 2 zonas.

**Checkpoint F5:** US-02 completa; partido nocturno en el día local correcto.

---

## Fase 6 — Match Center pre-partido y en vivo (2,5 d)

- [ ] **T082** `MatchHeader` + `Scoreboard` (escudos oficiales, marcador, estado, competencia, ronda).
- [ ] **T083** `MatchCountdown` cliente con `LocalDate` y cálculo de diferencia (sin `setInterval` en SSR).
- [ ] **T084** Layout de pestañas accesibles (`?tab=`) con Radix y carga diferida por pestaña.
- [ ] **T085** Previa: sede, árbitro, TV, H2H (últimos 5), formaciones probables y ausencias.
- [ ] **T086** `LineupPitch` con resolución de jugadores contra la plantilla normalizada y fallback «Jugador desconocido» (FR-074).
- [ ] **T087** Hook `useMatchPolling` con TanStack Query (30 s, pausa en background, refetch al volver).
- [ ] **T088** Live: `LiveIndicator`, «Actualizado hace X s», refresco manual, aviso no bloqueante ante error.
- [ ] **T089** `EventTimeline` en vivo con `aria-live="polite"` para goles y rojas.
- [ ] **T090** Estados aplazado/suspendido/cancelado con motivo y sin datos falsos.
- [ ] **T091** Tests de componentes: tabs, countdown, estados, error de polling, jugador ausente de plantel.
- [ ] **T092** E2E con `page.clock`: scheduled → kickoff → live → finalized; verificar badge y minuto.

**Checkpoint F6:** US-03 completa; sin fugas de `setInterval` ni errores de hidratación.

---

## Fase 7 — Ficha post-partido (1,5 d)

- [ ] **T093** `MatchResultSummary`: resultado final, entretiempo y duración.
- [ ] **T094** `EventTimeline` completa con minuto, descuento, jugador, equipo y tipo (incluye VAR y autogoles).
- [ ] **T095** `StatsBars`: 8 métricas comparativas con valor numérico y `aria-label` que incluya ambos valores.
- [ ] **T096** `RatingsTable`: nota 1 decimal o «SC», orden por puesto/nota, minutos, goles, asistencias y tarjetas.
- [ ] **T097** Tarjeta de MVP y promedio del equipo (excluyendo «SC»).
- [ ] **T098** Tests de componentes: tabla de notas, orden, MVP, promedio y evento huérfano omitido.
- [ ] **T099** E2E: abrir Calificaciones → verificar MVP, «SC» y promedio.

**Checkpoint F7:** US-04 completa; datos consistentes con la ficha de temporada.

---

## Fase 8 — Ficha histórica de temporada (1 d)

- [ ] **T100** `TopScorerCard` y `TopAssisterCard` con foto, totales y badge de empate técnico.
- [ ] **T101** Top 5 de goleadores y asistentes con barras proporcionales.
- [ ] **T102** `SeasonRecordGrid`: PJ/PG/PE/PP/GF/GC/DG/efectividad + racha + últimos 5.
- [ ] **T103** Splits local/visitante y filtro por competición que recalcula todo.
- [ ] **T104** Panel de jugador (drawer/dialog) con totales de temporada, accesible por teclado.
- [ ] **T105** Página `/temporada` + estados vacíos (temporada sin partidos finalizados).
- [ ] **T106** Test de consistencia SC-007 sobre fixtures y E2E de filtro por competición.

**Checkpoint F8:** US-05 completa.

---

## Fase 9 — Hardening y release (1,5 d)

- [ ] **T107** Auditoría axe (4 rutas) y corrección de violaciones critical/serious.
- [ ] **T108** Revisión de teclado y lector de pantalla en filtros, tabs, drawer, calendario y `ClubCrest`.
- [ ] **T109** Lighthouse CI: Performance, Accessibility, Best Practices y SEO ≥ 95.
- [ ] **T110** Optimización de imágenes/fuentes/escudo y verificación del presupuesto JS (≤ 180 KB gzip) y CLS.
- [ ] **T111** JSON-LD `SportsEvent` y `BreadcrumbList`; `sitemap.ts` y `robots.ts`.
- [ ] **T112** Prueba de degradación del proveedor en preview (forzar error → snapshot + aviso).
- [ ] **T113** Revisión de estados de error, reintentos y 404.
- [ ] **T114** Smoke test en preview de Vercel (desktop + móvil real) y revisión de uso del escudo.
- [ ] **T115** Actualizar README raíz, `spec.md`, `plan.md` y este `tasks.md` con el estado final.

**Checkpoint F9 (release v1):** DoD de `spec.md §11` cumplida al 100 %.

---

## Backlog posterior (fuera de v1)

- Autenticación y favoritos con recordatorios.
- Integración de partidos con API real (adaptador `ApiMatchRepository` + caché y backoff).
- Página pública de plantel (`/plantel`) con perfiles y trayectoria.
- Ingesta de calificaciones individuales desde el proveedor.
- Votación de MVP por usuarios.
- Historial de temporadas anteriores y comparador.
- PWA offline + push notifications.
- Fútbol femenino y juveniles como entidades de primera clase.
- i18n (`es-AR` / `en`).

---

## Resumen de esfuerzo

| Fase | Tareas | Días ideales |
|------|--------|--------------|
| F0 Bootstrap | T001–T010 | 0,5 |
| F1 Dominio (incluye plantel) | T011–T038 | 2,0 |
| F2 Datos mock | T039–T045 | 1,0 |
| F2B Proveedor de plantel | T046–T057 | 1,0 |
| F3 Shell / marca / Home | T058–T067 | 1,5 |
| F4 Novedades | T068–T074 | 1,5 |
| F5 Calendario | T075–T081 | 1,5 |
| F6 Match Center | T082–T092 | 2,5 |
| F7 Post-partido | T093–T099 | 1,5 |
| F8 Temporada | T100–T106 | 1,0 |
| F9 Hardening | T107–T115 | 1,5 |
| **Total** | **115 tareas** | **~15,5 días** |

---

**Fin de tasks.md v0.2.0.**
