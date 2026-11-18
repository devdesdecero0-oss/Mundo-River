---
feature: 009-amistosos-no-contables
documento: spec
estado: Aprobado
version: 1.0.0
fecha: 2026-11-17
metodologia: Spec-Driven Development
---

# Especificación — Amistosos no contables

## Objetivo

Registrar automáticamente los partidos amistosos publicados por Bzzoiro sin incorporarlos a los cálculos oficiales de la aplicación.

## Alcance

- Los eventos de Bzzoiro cuya competición sea de tipo `friendly` se muestran en calendario.
- También pueden abrirse en Match Center con fecha, rival, resultado, incidencias y estadísticas disponibles.
- Los amistosos no se incluyen en el rendimiento numérico del plantel.

## Exclusiones numéricas

Un amistoso no modifica:

- Puntaje ni promedio de un jugador.
- Cantidad de partidos evaluados.
- Cantidad de partidos finalizados usada como divisor.
- Estadísticas oficiales o tablas de competición.

Los partidos oficiales mantienen el comportamiento actual.

## Fuente y actualización

- La fuente principal es Bzzoiro.
- No se agrega carga manual mientras Bzzoiro publique el evento.
- Se conserva la clasificación de competición `friendly`/`Amistosos`.
