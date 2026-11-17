---
feature: 003-modo-oscuro
documento: tasks
estado: Completado
version: 1.0.0
fecha: 2026-11-16
metodologia: TDD — test primero, implementación después
---

# Tareas — Modo oscuro

- [x] **T201** Crear spec, plan y tareas.
- [x] **T202** Test unitario de `theme.ts` (validación, resolución, toggle, mensajes y script).
- [x] **T203** Implementar `src/lib/theme.ts` y `src/lib/theme.server.ts`.
- [x] **T204** Implementar `ThemeProvider` con cookie, sistema y `BroadcastChannel`.
- [x] **T205** Implementar `ThemeToggle` accesible.
- [x] **T206** Integrar script temprano, provider, `<html>` y viewport en `layout.tsx`.
- [x] **T207** Definir tokens claros/oscuros y ajustar componentes CSS en `globals.css`.
- [x] **T208** Migrar superficies oscuras a `inverse` y tarjetas a `surface`.
- [x] **T209** Migrar chips/controles a `strong` y textos sobre blanco/oro a `on-light`.
- [x] **T210** Migrar rojo de texto a `river-ink` y estados a `warning`/`alert`.
- [x] **T211** Cubrir loading, error, 404, skeletons y overlays.
- [x] **T212** Agregar E2E de alternancia y persistencia.
- [x] **T213** Actualizar README, AGENTS.md y MEMORY.md.
- [x] **T214** Verificar lint, typecheck, tests, build y E2E.
- [x] **T215** Corregir contrastes residuales en oscuro: ficha de nota (`bg-white` → `bg-surface`), MVP, verde H2H, fechas fuera de mes, placeholder y etiquetas al 35–45 % de opacidad.

## Resultado

- 9 tests unitarios de tema; suite total **166 tests**.
- **16 E2E** en verde, incluidos toggle + persistencia y la ficha de nota en oscuro.
- `pnpm lint`, `pnpm typecheck`, `pnpm build` limpios.
- Revisión visual en oscuro: home, calendario, temporada, novedades, ficha de nota, Match Center y home móvil.
- Ajuste final: en oscuro `strong` se invierte a pill clara para que los controles activos no se pierdan sobre el fondo.
- Corrección de contraste: el texto claro sobre las tres superficies blancas fijas de la ficha de nota pasaba a 1.12:1; ahora usa `bg-surface` (16:1).
