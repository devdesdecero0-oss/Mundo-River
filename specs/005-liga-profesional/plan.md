---
feature: 005-liga-profesional
documento: plan
estado: Aprobado
version: 1.0.0
fecha: 2026-11-17
---

# Plan técnico — Liga Profesional

## Estrategia

1. Crear tipos y funciones puras de standings en `src/domain/standings/`.
2. Agregar schemas tolerantes para respuestas de eventos y posiciones de Bzzoiro.
3. Extender el repositorio server-side para cargar todos los eventos regulares de LPF con paginación y el grupo oficial de River.
4. Agregar repositorio mock para tests y desarrollo sin token.
5. Crear `/liga-profesional` como página server-rendered y un componente de tabla presentacional.
6. Agregar la ruta a la navegación.

## Fuente de cada tabla

- **Anual:** eventos de `league_id=85`, `season_id` vigente, fases `group-stage`/`league-phase`, agregados por equipo.
- **Grupo:** respuesta de `leagues/85/standings/`, grupo donde aparece `team_id=755`.

## Caché

- Eventos anuales: `revalidate: 300`, tag `liga-profesional`.
- Standings oficiales: `revalidate: 300`, tag `liga-profesional-standings`.
- La paginación usa `limit=200` y `offset` hasta completar `count`.

## Pruebas

- Dominio: cálculo de tabla, puntos, diferencia, exclusión de no finalizados y playoffs, desempates y selección del grupo de River.
- Provider: parseo de filas de standings y paginación.
- E2E: ruta, encabezados, tabla anual, grupo de River y responsive.
