---
feature: 007-plantel-rendimiento
documento: spec
estado: Aprobado
version: 1.0.0
fecha: 2026-11-17
metodologia: Spec-Driven Development
---

# Especificación — Plantel y rendimiento

## Objetivo

Crear `/plantel` con el plantel vigente de River y el puntaje individual acumulado de la temporada.

## Reglas

- Se muestra el plantel vigente completo.
- Solo se consideran partidos finalizados de River para el divisor.
- El puntaje de un jugador es la suma de sus calificaciones válidas dividida por la cantidad total de partidos finalizados de River.
- Una calificación ausente no suma, pero el partido finalizado sí cuenta en el divisor.
- Las calificaciones válidas están entre 1 y 10; las demás se ignoran.
- El promedio se presenta en la escala 1–10, con hasta un decimal por la regla de dominio.
- Jugadores sin calificaciones válidas muestran `SC` y aparecen al final.
- El orden inicial es de mayor a menor puntaje.
- No se filtra por competición: el cálculo usa la temporada completa.
- La actualización ocurre cuando Bzzoiro publica estadísticas del partido finalizado y vence la revalidación.
- Cada jugador permite elegir uno de sus partidos evaluados para abrir `/partidos/[id]`.

## Fuera de alcance

- Índice combinado con goles, asistencias o minutos.
- Puntaje porcentual independiente del promedio 1–10.
- Edición manual de calificaciones.
- Historial de planteles de temporadas anteriores.
