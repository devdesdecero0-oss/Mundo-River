---
feature: 007-plantel-rendimiento
documento: tasks
estado: Completado
version: 1.0.0
fecha: 2026-11-17
metodologia: TDD — test primero, implementación después
---

# Tareas — Plantel y rendimiento

- [x] **T701** Crear spec, plan y tareas.
- [x] **T702** Crear tests del cálculo de rendimiento.
- [x] **T703** Implementar dominio de rendimiento.
- [x] **T704** Crear página y lista responsive del plantel.
- [x] **T705** Agregar enlaces a partidos evaluados.
- [x] **T706** Ajustar revalidación de estadísticas finalizadas.
- [x] **T707** Agregar navegación, E2E y metadata.
- [x] **T708** Ejecutar verificaciones y actualizar memoria.

## Resultado

- Nueva ruta `/plantel` con el plantel vigente completo.
- Puntaje individual calculado sobre todos los partidos finalizados de River.
- Jugadores sin calificación mostrados como `SC`.
- Enlaces a los partidos evaluados de cada jugador.
- Revalidación de estadísticas finalizadas reducida a cinco minutos.
- Verificación: 207 tests unitarios, 34 E2E, lint, typecheck y build en verde.
