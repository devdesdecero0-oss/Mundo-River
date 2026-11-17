---
feature: 006-detalle-calendario
documento: tasks
estado: Completado
version: 1.0.0
fecha: 2026-11-17
metodologia: TDD — test primero, implementación después
---

# Tareas — Detalle contextual del calendario

- [x] **T601** Crear spec, plan y tareas.
- [x] **T602** Crear tests puros del modelo contextual.
- [x] **T603** Implementar el modelo contextual.
- [x] **T604** Crear e integrar el panel accesible.
- [x] **T605** Hacer interactivas las fechas y partidos del calendario.
- [x] **T606** Agregar pruebas E2E.
- [x] **T607** Ejecutar verificaciones y actualizar memoria.

## Resultado

- El calendario abre un panel con todos los partidos de la fecha.
- La selección se conserva en `?partido=<id>`.
- Se muestran sede, hora, resultado, estado, motivo y minuto en vivo según corresponda.
- Verificación: 203 tests unitarios, 32 E2E, lint, typecheck y build en verde.
