---
feature: 011-notificaciones-novedades
documento: tasks
estado: Completado
version: 1.0.0
fecha: 2026-11-18
metodologia: TDD — test primero, implementación después
---

# Tareas — Notificaciones de novedades

- [x] **T1101** Crear especificación y plan técnico.
- [x] **T1102** Crear dominio de deduplicación y configuración.
- [x] **T1103** Crear API de suscripciones y procesamiento Push.
- [x] **T1104** Integrar UI y service worker.
- [x] **T1105** Agregar cron externo, pruebas y documentación.
- [x] **T1106** Ocultar el control con suscripción activa y sincronizar el estado entre pestañas.
- [x] **T1107** Detectar Brave y mostrar diagnóstico accionable para errores Push.

## Resultado

- Push en segundo plano con suscripción explícita.
- Vercel KV y GitHub Actions cada cinco minutos; Vercel Hobby no admite cron frecuentes.
- Deduplicación por enlace original y notificación con título/fuente.
- El control de activación desaparece con una suscripción activa y se sincroniza entre pestañas.
- Brave muestra instrucciones específicas cuando Shields o la mensajería Push bloquean la suscripción.
- Verificación: 217 tests unitarios, 36 E2E, lint, typecheck y build en verde.
