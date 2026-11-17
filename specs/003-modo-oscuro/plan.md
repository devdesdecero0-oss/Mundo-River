---
feature: 003-modo-oscuro
documento: plan
estado: Aprobado
version: 1.0.0
fecha: 2026-11-16
---

# Plan técnico — Modo oscuro

## Estrategia

1. Tokens semánticos en `globals.css` con variante por clase (`.dark`).
2. Preferencia en cookie `mr_theme`, leída en el servidor y aplicada en `<html>`.
3. Script temprano con `next/script` (`beforeInteractive`) para resolver el sistema antes del primer pintado.
4. `ThemeProvider` cliente con estado, cookie y `BroadcastChannel`.
5. `ThemeToggle` accesible en el header.
6. Barrido de superficies: separar `ink` (texto) de `inverse` (hero/footer), `surface` (tarjetas), `strong` (controles invertidos), `river-ink` (texto rojo) y colores de estado.

## Tokens

- `paper`, `paper-deep`, `surface`, `ink`, `ink-soft`, `ink-muted`, `line`.
- `inverse`, `inverse-muted`: superficies siempre oscuras.
- `strong`, `on-strong`: controles que se invierten con el tema.
- `on-light`: texto fijo oscuro sobre blancos y dorados.
- `river-ink`: rojo de texto con contraste AA.
- `warning-*` y `alert-*`: estados aplazado y suspendido.

## Riesgos y mitigaciones

- **FOUC / mismatch de hidratación** → script beforeInteractive + `suppressHydrationWarning`.
- **Superficies `bg-ink` que se aclararían** → auditar y migrar a `bg-inverse` o `bg-strong`.
- **Texto sobre blanco/oro** → `on-light`.
- **Rojo ilegible en oscuro** → `river-ink`.
- **Cookie bloqueada** → el tema funciona en memoria; solo se pierde persistencia.
- **Navegadores sin BroadcastChannel** → se omite la sincronización.

## Pruebas

- Unitarias: `isTheme`, `resolveTheme`, `nextTheme`, `parseThemeMessage`, script inicial.
- E2E: alternar, recargar y volver a claro en desktop y móvil.
- Manual: contraste, gold/alertas, campo, skeletons y forced-colors.
