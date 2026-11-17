---
feature: 006-detalle-calendario
documento: plan
estado: Aprobado
version: 1.0.0
fecha: 2026-11-17
---

# Plan técnico — Detalle contextual del calendario

1. Crear funciones puras para resolver el contenido contextual de cada partido.
2. Cubrir estados, sede ausente, motivo ausente y marcador/minuto con Vitest.
3. Integrar botones de fecha y partido en `CalendarView`.
4. Crear un panel accesible que muestre todos los partidos de la fecha.
5. Persistir el partido seleccionado en `?partido=<id>` sin perder los filtros existentes.
6. Agregar pruebas E2E para apertura, contenido, URL, cierre y modo móvil.
7. Ejecutar suite unitaria, lint, typecheck, build y E2E.
