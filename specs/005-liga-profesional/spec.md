---
feature: 005-liga-profesional
documento: spec
estado: Aprobado
version: 1.0.0
fecha: 2026-11-17
metodologia: Spec-Driven Development
---

# Especificación — Liga Profesional

## Objetivo

Agregar una página propia de Liga Profesional con la tabla anual y la tabla del grupo o zona al que pertenece River, usando datos reales de Bzzoiro en producción y fixtures deterministas en tests.

## Alcance

- Nueva ruta `/liga-profesional`.
- Entrada “Liga Profesional” en la navegación principal.
- Tabla anual de la temporada vigente.
- Tabla del grupo de River obtenida del endpoint oficial de standings.
- River resaltado en ambas tablas.
- Puntos, partidos, ganados, empatados, perdidos, goles a favor, goles en contra, diferencia y forma reciente.
- Revalidación server-side y fallback mock.
- Responsive y compatible con tema claro/oscuro.

## Reglas de datos

- La competición de Liga Profesional es el proveedor `league_id=85`.
- La tabla anual se calcula con partidos finalizados de las fases regulares (`group-stage` y `league-phase`) de la temporada de Liga Profesional; se excluyen octavos, cuartos, semifinales y final.
- La tabla de grupo se obtiene de `GET /api/v2/leagues/85/standings/`.
- Se selecciona automáticamente el grupo que contiene al equipo proveedor `755` (River).
- Victoria suma 3 puntos, empate 1 y derrota 0.
- Un partido sin marcador o no finalizado no suma.
- Si Bzzoiro no responde, la página muestra datos mock y un estado no bloqueante de respaldo.

## Fuera de alcance

- Tabla de otras competiciones.
- Pronóstico de clasificación.
- Edición manual de posiciones.
- Copas argentinas no publicadas por Bzzoiro.
- Nueva dependencia externa.

## Criterios de aceptación

- `/liga-profesional` muestra tabla anual y tabla del grupo de River.
- La tabla anual no cuenta playoffs como partidos de fase regular.
- River aparece destacado y su posición se identifica claramente.
- Las posiciones se actualizan con la revalidación del proveedor.
- Sin token o con proveedor caído, la ruta no rompe y usa mock.
- Los filtros y datos del resto del sitio no regresan.
- `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build` y E2E pasan.
