---
feature: 002-datos-reales
documento: tasks
estado: Implementado (E2E pendiente de configuración mock)
version: 0.2.0
fecha: 2026-11-16
metodologia: TDD — test primero, implementación después
---

# Tareas — Datos reales (v2)

> Reglas: cada tarea cierra con tests en verde; orden TDD; sin llamadas reales en CI.
> `[P]` = paralelizable. Estados: `[ ]` pendiente · `[~]` en curso · `[x]` hecho.

## Fase 0 — Verificación y preparación

- [x] **T101** Verificar `BZZOIRO_TOKEN` y que `.env.local` exista (sin exponer el valor).
- [x] **T102** Resolver IDs de River, temporada y competiciones; guardar JSON de muestra en `src/data/providers/bzzoiro/__fixtures__/`.
- [x] **T103** Confirmar rango de `rating`, campos de `player-stats` y cobertura de Copa Argentina.
- [x] **T104** Aprobar e instalar `fast-xml-parser`.
- [x] **T105** Crear `src/lib/env.ts` con esquema Zod (`BZZOIRO_TOKEN`, `DATA_MODE`, `NEWS_FEEDS`).

## Fase 1 — Dominio

- [x] **T106** Test: `deriveMatchStatus` prioriza `providerStatus` sobre el reloj.
- [x] **T107** Implementar `providerStatus` y `providerMinute` en `Match`; ajustar `deriveMatchStatus`/`computeMatchMinute`.
- [x] **T108** Test: `normalizeRating` acepta 1-10 y devuelve `SC` fuera de rango (incluye valores reales del proveedor).
- [x] **T109** Extender `NewsArticle` con `externalUrl` y `sourceName`; ajustar fixtures y tests.
- [x] **T110** Agregar `listPlayerStats()` al contrato de `MatchesRepository` e implementarlo en el mock.

## Fase 2 — Proveedor Bzzoiro

- [x] **T111** Test de mapper de partidos con payload grabado (estados, marcador, equipos, competición).
- [x] **T112** Implementar `client.ts` (auth, timeout, reintentos, single-flight) y `schemas.ts` (Zod).
- [x] **T113** Implementar `mapMatch`, `mapTeam`, `mapCompetition`, `mapSeason` y la resolución de IDs.
- [x] **T114** Test de mapper de detalle: incidencias, stats, lineups, player-stats, H2H.
- [x] **T115** Implementar los mappers de detalle y la agregación de estadísticas.
- [x] **T116** Test de mapper de plantel (dorsal, posición, disponibilidad, lesión, jugador inválido omitido).
- [x] **T117** Implementar `mapSquad` y el snapshot validado.

## Fase 3 — Repositorios live

- [x] **T118** Implementar `BzzoiroMatchesRepository` con caché y tags.
- [x] **T119** Implementar `BzzoiroSquadRepository` con caché de 6 h y fallback.
- [x] **T120** Implementar `BzzoiroNewsRepository` o adaptador RSS.
- [x] **T121** Selector `DATA_MODE` en `src/data/repositories/index.ts`; mantener mock como default en tests.
- [ ] **T122** Script `pnpm data:snapshot` y snapshots de respaldo.
- [ ] **T123** Aviso no bloqueante de datos de demostración o proveedor caído.

## Fase 4 — Noticias RSS

- [x] **T124** Test del parser con feed grabado (canal, ítem válido, ítem inválido, sin imagen).
- [x] **T125** Implementar parser, filtro por River, deduplicación y clasificación.
- [x] **T126** Implementar cliente de feeds con timeout y caché de 5 min.

## Fase 5 — UI y páginas

- [x] **T127** Home: usar repositorios para equipos/temporada; eliminar imports de fixtures; estado sin próximo partido.
- [x] **T128** Calendario: competiciones derivadas y filtros sin datos ocultos.
- [x] **T129** Match Center: mapear `providerStatus`/`providerMinute`, ocultar tabs sin datos, ratings reales.
- [x] **T130** Temporada: usar `listPlayerStats()` y plantel real.
- [x] **T131** Novedades: tarjeta con fuente/fecha y detalle con enlace externo.
- [x] **T132** Aviso de fuente, atribución y descargo no oficial.

## Fase 6 — Calidad y cierre

- [x] **T133** E2E en `DATA_MODE=mock`; ajustar expectativas a datos reales cuando corresponda.
  - `playwright.config.ts` inyecta `DATA_MODE=mock` en el `webServer`; 12 E2E en verde.
- [x] **T134** Tests de arquitectura: dominio sin red; cliente sin token.
- [x] **T135** Actualizar README y `MEMORY.md`.
- [x] **T136** `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e`.
  - Todo en verde: lint, typecheck, 157 tests unitarios, build y 12 E2E.

**Checkpoint final:** app con datos reales, fallback funcionando y suite completa en verde.

## Brechas conocidas

- Bzzoiro no expone Copa Argentina ni Trofeo de Campeones en sus ligas actuales: esos partidos no aparecen hasta que el proveedor los publique.
- El plantel real incluye dorsales duplicados; la normalización descarta duplicados y avisa por consola.
