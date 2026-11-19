---
feature: 011-notificaciones-novedades
documento: spec
estado: Aprobado
version: 1.0.0
fecha: 2026-11-18
metodologia: Spec-Driven Development
---

# Especificación — Notificaciones de novedades

## Objetivo

Permitir que el usuario reciba avisos Push cuando aparezcan nuevas novedades de River en celular y computadora.

## Reglas

- El permiso se solicita únicamente después de una acción explícita del usuario.
- Las suscripciones se guardan en Vercel KV.
- Vercel Cron procesa novedades cada cinco minutos.
- Una novedad se identifica por su enlace original.
- Se envía una notificación individual por cada novedad nueva.
- El aviso contiene título y fuente, y abre la novedad al pulsarlo.
- El service worker muestra la notificación y gestiona el click.
- En iPhone/iPad se informa que la PWA debe estar instalada.
- Si el permiso se rechaza, el aviso se oculta durante la sesión.
- Las claves VAPID y los secretos de KV solo viven en el servidor.
