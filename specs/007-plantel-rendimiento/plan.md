---
feature: 007-plantel-rendimiento
documento: plan
estado: Aprobado
version: 1.0.0
fecha: 2026-11-17
---

# Plan técnico — Plantel y rendimiento

1. Crear funciones puras para contar partidos finalizados, deduplicar estadísticas y calcular el puntaje de cada jugador.
2. Escribir tests de divisor total, notas ausentes, notas inválidas, `SC`, orden y enlaces de partidos.
3. Crear `/plantel` como página server-rendered usando repositorios existentes.
4. Crear una lista responsive con `details` para elegir partidos evaluados.
5. Agregar Plantel a la navegación.
6. Reducir la revalidación de estadísticas finalizadas para reflejar nuevos partidos sin esperar una hora.
7. Agregar pruebas E2E y ejecutar la suite completa.
