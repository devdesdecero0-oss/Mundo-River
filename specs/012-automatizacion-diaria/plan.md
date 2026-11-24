---
feature: 012-automatizacion-diaria
documento: plan
estado: Aprobado
version: 1.0.0
fecha: 2026-11-24
---

# Plan técnico

1. `scripts/auditoria-diaria.mjs` ejecutará las validaciones de forma
   secuencial y generará el reporte.
2. La única corrección automática será `eslint --fix`, excluyendo secretos,
   configuración raíz y archivos de entorno.
3. `.github/workflows/revision-diaria.yml` programará la ejecución a las
   10:00 UTC, habilitará ejecución manual y conservará el reporte.
4. El workflow enviará el Markdown mediante Gmail SMTP sobre TLS usando
   `GMAIL_APP_PASSWORD`.
5. El workflow no hará deploy ni escribirá cambios en el repositorio.

## Limitación deliberada

La ejecución diaria no invoca agentes conversacionales ni realiza cambios
arbitrarios. Los errores que no pueda corregir quedan detallados en el
reporte para intervención manual.
