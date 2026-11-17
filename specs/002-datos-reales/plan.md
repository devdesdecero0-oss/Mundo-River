---
feature: 002-datos-reales
documento: plan
estado: Draft (deriva de spec.md v0.1.0)
version: 0.1.0
fecha: 2026-11-13
autor: Lead Software Architect
---

# Plan técnico — Datos reales (v2)

## 1. Decisiones de arquitectura

| Área | Decisión | Motivo |
|------|----------|--------|
| Proveedor de partidos | **Bzzoiro Sports Data v2** | Gratis, 7.500 req/día, cobertura completa de Liga Argentina, lineups, stats y ratings |
| Proveedor de noticias | **RSS + Google News** | Sin costo, titulares frescos y enlace a la fuente |
| Integración | Adaptador server-side + mappers puros | La UI y el dominio no conocen el proveedor |
| Validación | **Zod** en el borde | Detectar cambios de contrato y no propagar datos inválidos |
| Caché | `fetch` con `next.revalidate` + tags | Reduce llamadas y respeta el rate limit |
| Respaldo | Snapshots JSON validados | Operación ante caída o falta de token |
| Modos | `DATA_MODE=mock|live` | Tests deterministas y demo sin conexión |
| Ratings | Campo `rating` del proveedor | Evita inventar notas; `null` ⇒ `SC` |
| Estado | `providerStatus` + `providerMinute` | No derivar el estado real solo del reloj |

## 2. Capas

```text
src/app/**                    Server Components: leen repositorios
src/components/**             UI cliente: filtros, tabs, polling
src/data/repositories/**      Contratos + implementaciones mock/live
src/data/providers/bzzoiro/** Cliente HTTP, esquemas Zod, mappers (server-only)
src/data/providers/news/**    Cliente RSS, parser y clasificador
src/data/snapshots/**         Respuestas normalizadas de respaldo
src/domain/**                 Lógica pura (sin red, sin React)
src/lib/env.ts                Variables server-side validadas
```

Regla: `src/domain/**` no importa nada de `src/data/**` ni de `src/app/**`.

## 3. Mapeo Bzzoiro → dominio

| Bzzoiro | Dominio | Notas |
|---------|---------|-------|
| `events/` | `Match[]` | Filtrar por `team_id` de River y temporada |
| `events/{id}/` | `Match` | Kickoff, venue, árbitro, estado, marcador |
| `events/{id}/incidents/` | `MatchEvent[]` | Gol, tarjeta, cambio, VAR, penal |
| `events/{id}/stats/` | `TeamMatchStats` | Posesión, tiros, córners, faltas, pases |
| `events/{id}/lineups/` | `Lineup[]` | Titulares, suplentes, formación, capitán |
| `events/{id}/player-stats/` | `PlayerMatchStats[]` | Minutos, rating, goles, asistencias, tarjetas |
| `events/{id}/h2h/` | `H2HSummary` | Se calcula en dominio a partir de los partidos |
| `teams/{id}/squad/` | `SquadSnapshot` | Dorsal, posición, nacionalidad, disponibilidad |
| `leagues/` + `seasons/` | `Competition[]`, `Season` | Solo competiciones con partidos de River |
| `teams/` | `Team[]` | Nombre, colores, país |

Los campos que falten se omiten; nunca se inventan valores. `null` del proveedor se conserva como `null` o se descarta según el campo.

## 4. IDs y normalización

- Partido: `bzzoiro:<event_id>`.
- Jugador: `bzzoiro:<player_id>` (o `river:<externalId>` si se mantiene el contrato actual).
- Equipo: `bzzoiro:<team_id>`; River se mapea además al alias interno `river`.
- Competición: `bzzoiro:<league_id>-<season>`.
- La resolución se guarda en un mapa en memoria durante la request y en caché entre requests.

## 5. Caché y rate limit

| Dato | Revalidación | Tag |
|------|--------------|-----|
| Partido en vivo | 15 s | `matches:live` |
| Listado de partidos | 5 min | `matches` |
| Detalle de partido | 10 min | `match:<id>` |
| Plantel | 6 h | `squad` |
| Estadísticas de jugadores | 10 min | `player-stats` |
| Noticias | 5 min | `news` |

- `fetch` con `Authorization: Token ...`, timeout de 5 s y `AbortSignal.timeout`.
- Hasta 3 reintentos con backoff exponencial solo para errores 5xx/red.
- Single-flight por clave para evitar ráfagas.
- Límite de concurrencia de 4 al agregar estadísticas por partido.

## 6. Resiliencia

1. Intentar proveedor.
2. Si falla o el payload no valida, leer snapshot del mismo tipo.
3. Si no hay snapshot, usar fixtures mock y mostrar aviso “Datos de demostración”.
4. Nunca romper el render: las páginas muestran estados vacíos.

El snapshot se genera con `pnpm data:snapshot` y se valida con los mismos esquemas.

## 7. Noticias

- Fuentes iniciales: Google News (`q=River Plate`), Olé, Infobae, Clarín y La Nación.
- Parser XML tolerante (`fast-xml-parser`, pendiente de aprobación).
- Filtro por palabras clave: River, Millonario, Monumental, Gallardo, Liga Profesional, Libertadores.
- Clasificación: plantel, inferiores, institucional, mercado de pases.
- Deduplicación por título normalizado (sin acentos, minúsculas).
- Imagen: `enclosure`/`media:content` si existe; si no, portada SVG por categoría.
- Detalle: resumen + fuente + botón externo. No se copia el cuerpo.

## 8. Cambios de UI

- Home: usar `matchesRepository.getTeams()`/`getSeason()`; eliminar imports de fixtures.
- Home sin próximo partido: mostrar último resultado y CTA al calendario.
- Calendario: competiciones derivadas; no mostrar filtros sin partidos.
- Match Center: ocultar tabs sin datos; ratings reales; aviso de fuente.
- Temporada: usar `listPlayerStats()` y plantel real.
- Novedades: tarjeta con fuente y fecha; detalle con enlace externo.
- Footer/aviso: “Datos: Bzzoiro · Noticias: fuentes originales · Sitio no oficial”.

## 9. Variables de entorno

```env
BZZOIRO_TOKEN=...          # obligatorio en modo live
DATA_MODE=live             # live | mock (default: live si hay token)
NEWS_FEEDS=...             # opcional, lista separada por comas
```

`src/lib/env.ts` valida con Zod y falla solo en build si `DATA_MODE=live` y falta el token; en runtime cae a mock con aviso.

## 10. Pruebas

- Unitarias de mappers con JSON grabado en `src/data/providers/**/__fixtures__/`.
- Unitarias de dominio para `providerStatus`, `providerMinute` y `normalizeRating`.
- Tests del parser RSS con feeds grabados (incluye ítem inválido).
- E2E con `DATA_MODE=mock` para no depender de red ni del calendario real.
- Sin llamadas reales en CI.

## 11. Fases

1. **F0** Verificación con token: IDs de River, temporada, competiciones, rango de rating, cobertura de Copa Argentina.
2. **F1** Extensiones de dominio + tests.
3. **F2** Cliente Bzzoiro + esquemas + mappers + tests.
4. **F3** Repositorios live, caché y snapshots.
5. **F4** Adaptador RSS + clasificador + tests.
6. **F5** Refactor de páginas y UI.
7. **F6** E2E, documentación, MEMORY y verificación completa.

## 12. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Bzzoiro cambia el contrato | Zod + snapshot + tests grabados |
| Falta Copa Argentina | Detectar y omitir; evaluar segundo proveedor |
| Rating fuera de escala | `normalizeRating` + prueba con dato real |
| Feed RSS cambia | Parser tolerante + omitir ítems inválidos |
| Rate limit | Caché + concurrencia limitada |
| Token ausente | Modo mock visible, sin romper |
