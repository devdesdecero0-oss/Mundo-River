---
feature: 005-liga-profesional
documento: tasks
estado: Completado
version: 1.0.0
fecha: 2026-11-17
metodologia: TDD — test primero, implementación después
---

# Tareas — Liga Profesional

- [x] **T501** Crear spec, plan y tareas.
- [x] **T502** Crear tests puros para tabla anual, grupo, puntos y exclusión de playoffs.
- [x] **T503** Implementar dominio de standings.
- [x] **T504** Crear schemas/mappers de standings de Bzzoiro y paginación de eventos.
- [x] **T505** Implementar repositorios live/mock y contrato.
- [x] **T506** Crear página y tablas responsive de Liga Profesional.
- [x] **T507** Agregar Liga Profesional a la navegación y metadata.
- [x] **T508** Agregar tests E2E.
- [x] **T509** Ejecutar suite completa, actualizar documentación y desplegar.

## Resultado

- Implementación completa: página `/liga-profesional`, tabla anual de fases regulares, grupo oficial de River, navegación, sitemap y fallback mock.
- La API confirmada de Bzzoiro es `GET /leagues/85/standings/`; la tabla anual se calcula paginando `events/?league_id=85&season_id=...` y excluyendo playoffs.
- Verificación local: 198 tests unitarios, 28 E2E, lint, typecheck y build en verde.
