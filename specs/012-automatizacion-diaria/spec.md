---
feature: 012-automatizacion-diaria
titulo: "Auditoría diaria, correcciones seguras y reporte por Gmail"
estado: Aprobado
version: 1.0.0
fecha: 2026-11-24
metodologia: Spec-Driven Development (SDD)
---

# Especificación

## Objetivo

Ejecutar una auditoría diaria del proyecto a las 07:00 de
`America/Argentina/Buenos_Aires`, aplicar únicamente correcciones automáticas
seguras y enviar un reporte por Gmail.

## Requisitos funcionales

- **FR-1201** La auditoría DEBE ejecutarse diariamente mediante GitHub Actions.
- **FR-1202** La ejecución DEBE realizarse a las 07:00 de Argentina
  (10:00 UTC) y permitir ejecución manual.
- **FR-1203** DEBE validar specs, tests, lint, TypeScript, build y E2E.
- **FR-1204** Si lint falla, DEBE intentar una corrección automática limitada
  mediante ESLint y volver a validar.
- **FR-1205** No DEBE modificar secretos, archivos `.env`, configuración raíz
  ni hacer deploy.
- **FR-1206** DEBE generar un reporte Markdown con estado, errores,
  correcciones, archivos modificados y mejoras sugeridas.
- **FR-1207** DEBE enviar el reporte por Gmail usando secretos de GitHub.
- **FR-1208** DEBE conservar el reporte como artefacto de la ejecución.
- **FR-1209** Un fallo no corregido DEBE dejar la ejecución en estado fallido,
  pero el email DEBE enviarse igualmente.

## Seguridad

Las credenciales nunca se guardan en el repositorio. Se utilizan únicamente
`GMAIL_USER`, `GMAIL_APP_PASSWORD` y `REPORT_EMAIL` como secretos de GitHub.
