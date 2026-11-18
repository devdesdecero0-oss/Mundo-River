---
feature: 008-paleta-clara-river
documento: spec
estado: Aprobado
version: 1.0.0
fecha: 2026-11-17
metodologia: Spec-Driven Development
---

# Especificación — Paleta clara River

## Objetivo

Mejorar el modo claro de toda la aplicación para priorizar blanco y rojo River, manteniendo el modo oscuro actual.

## Reglas

- El modo claro usa superficies blancas y acentos rojos.
- El texto primario utiliza un rojo oscuro legible; los textos secundarios conservan contraste AA.
- Los controles activos utilizan rojo River con texto blanco.
- Los estados finalizados permanecen en gris neutro para distinguirlos de estados activos.
- Las bandas `inverse` y superficies fijas mantienen su contraste y no se modifican si cumplen una función temática o de accesibilidad.
- El modo oscuro conserva sus tokens actuales.
- Loading, error, 404, PWA, calendario, Match Center, Temporada, Plantel y Liga Profesional deben revisarse.

## Accesibilidad

- No se reemplaza texto por rojo claro sin verificar contraste.
- El color no es el único indicador de estado.
- Se mantienen focos visibles y textos alternativos.
