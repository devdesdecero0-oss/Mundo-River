---
feature: 011-notificaciones-novedades
documento: plan
estado: Aprobado
version: 1.0.0
fecha: 2026-11-18
---

# Plan técnico — Notificaciones de novedades

1. Añadir dominio puro para claves y deduplicación de novedades.
2. Configurar Vercel KV, VAPID y el endpoint protegido de cron.
3. Crear suscripción y procesamiento Push en el servidor.
4. Extender el service worker con `push` y `notificationclick`.
5. Integrar control explícito en header y menú móvil.
6. Agregar GitHub Actions como cron externo cada cinco minutos, porque la cuenta Hobby de Vercel no admite cron frecuentes.
7. Cubrir permisos, deduplicación, API, service worker y E2E.
8. Ocultar el control con suscripción activa y sincronizarlo entre pestañas.
9. Detectar Brave y explicar errores de permisos, Service Worker o suscripción Push.
