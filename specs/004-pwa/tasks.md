---
feature: 004-pwa
documento: tasks
estado: Completado
version: 1.0.0
fecha: 2026-11-16
metodologia: TDD — test primero, implementación después
---

# Tareas — PWA instalable

- [x] **T301** Crear spec, plan y tareas.
- [x] **T302** Test unitario de `pwa.ts` (standalone, iOS, modo de instalación y registro).
- [x] **T303** Implementar `src/lib/pwa.ts`.
- [x] **T304** Test unitario de `site-url.ts` y `manifest.ts`.
- [x] **T305** Implementar `src/lib/site-url.ts` y `src/lib/site.server.ts`; migrar `SITE_URL`.
- [x] **T306** Implementar `src/app/manifest.ts`.
- [x] **T307** Crear `scripts/generate-icons.mjs` y generar `public/icons/*.png`.
- [x] **T308** Implementar `public/sw.js` y la página `/offline`.
- [x] **T309** Implementar `PwaProvider` con registro, instalación y actualización.
- [x] **T310** Implementar botón de instalación (header + menú móvil e iOS).
- [x] **T311** Implementar aviso de actualización y aviso sin conexión.
- [x] **T312** Integrar manifest, íconos, `appleWebApp`, provider y avisos en `layout.tsx`.
- [x] **T313** Omitir refresco del Match Center sin conexión.
- [x] **T314** Excluir `/offline` en `robots.ts` y agregar `generate:icons` a `package.json`.
- [x] **T315** Agregar E2E de manifest, service worker, offline e instalación iOS.
- [x] **T316** Actualizar README, AGENTS.md y MEMORY.md.
- [x] **T317** Verificar `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build` y `pnpm test:e2e`.
- [x] **T318** Preparar y ejecutar el deploy manual en Vercel (`pnpm dlx vercel` / `--prod`).

## Resultado

- Implementación completa: manifest, service worker propio, `/offline`, instalación en header y menú móvil, instrucciones iOS, avisos de actualización y sin conexión.
- Suite en verde: **192 tests unitarios** (16 archivos) y **26 E2E** (Chromium + viewport móvil).
- `pnpm lint`, `pnpm typecheck` y `pnpm build` sin errores.
- Verificación visual: header 1280 sin overflow con el botón de instalación; `/offline` y modal iOS correctos en claro y oscuro.
- Hallazgos corregidos durante la verificación: servir el HTML de `/offline` bajo otra URL mostraba el skeleton (se cambió a redirección 302) y faltaban los chunks de la ruta en caché (ahora se parsean del HTML y se precachean).
- Deploy en producción: **https://mundo-river.vercel.app** (proyecto `devdesdecero0/mundo-river`).
- Verificación sobre la URL pública: `/`, `/manifest.webmanifest` (200, `application/manifest+json`), `/sw.js` (200), `/offline` e íconos responden 200; service worker `activated` con scope `https://mundo-river.vercel.app/`; navegación offline a una ruta no visitada redirige a `/offline` y muestra “Se cortó la señal”; canonical apunta a la URL de producción; sin errores de página.
- El deploy anónimo (`--temporary`) no sirve en Windows: el builder local crea enlaces simbólicos y falla con EPERM. Con sesión iniciada Vercel compila en la nube.
- `.vercelignore` excluye `.env.local`, `.next`, `node_modules`, `coverage`, `test-results`, `playwright-report` y `.opencode`.
