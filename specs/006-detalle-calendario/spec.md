---
feature: 006-detalle-calendario
documento: spec
estado: Aprobado
version: 1.0.0
fecha: 2026-11-17
metodologia: Spec-Driven Development
---

# Especificación — Detalle contextual del calendario

## Objetivo

Permitir que al tocar una fecha del calendario se muestre un panel con todos los partidos de ese día y la información contextual correspondiente a cada estado.

## Reglas confirmadas

- La información se muestra en un panel/modal sobre el calendario.
- Si hay varios partidos en una fecha, se muestran todos en el mismo panel.
- El partido seleccionado se refleja en la URL mediante `?partido=<id>`.
- Los partidos cancelados muestran el estado “Cancelado”.
- Si falta el motivo de un aplazamiento o suspensión, se muestra únicamente el estado.
- Si falta la sede, se muestra “Sede no informada”.
- Una fecha sin partidos no abre el panel.
- No se agrega un enlace al Match Center completo.
- Fechas y horas respetan la zona horaria local del usuario.
- Los partidos en vivo reutilizan el reloj y refresco actual del calendario.

## Contenido

- Próximo: sede y hora local.
- Finalizado: sede y resultado.
- Aplazado/suspendido: estado y motivo cuando el proveedor lo informa.
- En vivo: resultado, minuto o entretiempo.
- Cancelado: estado y, si existe, motivo.

## Accesibilidad

- Las fechas con partidos son botones accesibles.
- El panel usa `role="dialog"`, nombre accesible y cierre con Escape.
- El foco se devuelve al elemento que abrió el panel.
- La información no depende únicamente del color.

## Fuera de alcance

- Modificar el Match Center completo.
- Crear nuevas consultas al proveedor.
- Incorporar dependencias externas.
