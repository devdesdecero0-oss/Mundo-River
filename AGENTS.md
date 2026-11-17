# AGENTS.md — Mundo River

Plataforma web moderna, interactiva y responsive orientada a los hinchas de River Plate. Su objetivo es ofrecer noticias institucionales y deportivas en tiempo real junto con un Match-Center analítico detallado (calendario de temporada, resultados, estadísticas, incidencias y calificación de jugadores).

## Stack y estructura
- **Framework y Lenguaje:** Next.js (App Router), TypeScript, Tailwind CSS / PostCSS.
- **Gestor de paquetes:** `pnpm` (`pnpm-lock.yaml` y `pnpm-workspace.yaml`).
- **Testing y Calidad:** Vitest (`vitest.config.ts`) para pruebas unitarias/integración, Playwright (`playwright.config.ts`) para pruebas E2E, y ESLint (`.eslintrc`).
- **Estructura clave:**
  - `src/`: Código fuente de la aplicación (componentes UI, páginas, utilidades y lógica de dominio).
  - `specs/`: Documentación técnica bajo metodología Spec-Driven Development (`spec.md`, `plan.md`, `tasks.md`).
  - `e2e/`: Pruebas end-to-end automatizadas con Playwright.
  - `scripts/`: Automatizaciones locales y utilidades (incluye el lanzador `Abrir Mundo River`).
  - `public/`: Recursos estáticos, escudos, imágenes de noticias y assets visuales.

## Comandos
- **Instalar dependencias:** `pnpm install`
- **Levantar entorno de desarrollo:** `pnpm dev` (abre en `http://localhost:3000`)
- **Compilar para producción:** `pnpm build`
- **Ejecutar tests unitarios:** `pnpm test` (o `pnpm vitest run`)
- **Ejecutar tests E2E:** `pnpm exec playwright test`
- **Verificar linting:** `pnpm lint`
- **Regenerar íconos PWA:** `pnpm generate:icons`
- **Test: `node --test`

## Convenciones
- **Idioma:** Todo el contenido visible para el usuario, textos de interfaz, nombres de dominios de negocio y mensajes de commit deben estar en **español**.
- **Identidad Visual:** Respetar estrictamente la paleta institucional de River Plate: Blanco puro (`#FFFFFF`), Rojo River (`#E30613`), Negro (`#0A0A0A`) y acentos en Gris/Plateado.
- **Arquitectura de código:** Separar estrictamente la lógica de negocio (cálculo de promedios de calificaciones, filtros de torneos, formateo de fechas) en funciones puras dentro de `src/lib/` o `src/utils/` respecto de los componentes React en `src/components/`.
- **Tipado:** TypeScript estricto; evitar `any` explícitos o implícitos en modelos de partidos, jugadores y noticias.

## Tema y contraste
- **Preferencia:** se guarda únicamente en la cookie `mr_theme` (`light`/`dark`). Sin cookie rige `prefers-color-scheme`; no usar `localStorage` ni dependencias de temas.
- **Sin destello:** el tema se aplica en `<html>` desde el servidor y con el script temprano de `src/lib/theme.ts`; cualquier cambio debe mantener el primer pintado correcto.
- **Tokens semánticos:** nunca usar `bg-white`/`bg-black`/`bg-ink` para superficies que cambian con el tema. Usar `paper`, `surface`, `inverse` (siempre oscuro), `strong`/`on-strong` (controles invertidos) y `on-light` (texto oscuro sobre blanco u oro).
- **Superficies fijas:** si una superficie debe quedar blanca siempre (overlay, botón sobre banda roja, círculo del MVP), el texto debe usar un color fijo (`on-light`, `river`), nunca un token que se invierte (`ink`, `river-dark`). En oscuro el texto claro sobre blanco cae a 1.12:1.
- **Textos secundarios:** no bajar de 60 % de opacidad sobre `inverse` ni de 80 % sobre `paper`/`surface`; las opacidades de 35–50 % no llegan a AA en oscuro.
- **Rojos:** `bg-river` se reserva para rellenos institucionales; el rojo de texto usa `text-river-ink` para conservar contraste AA en oscuro. No reemplazar uno por otro sin revisar contraste.
- **Estados:** aplazado y suspendido usan `warning-*`/`alert-*`; un estado nunca se comunica solo por color.
- **Cobertura:** loading, error, 404, skeletons, overlays, panel del jugador y campo de juego también deben respetar ambos temas.
- **Pruebas:** la lógica de tema vive en `src/lib/theme.ts` con tests unitarios; todo cambio de toggle o persistencia debe pasar por `pnpm test` y el E2E de `e2e/smoke.spec.ts`.

## PWA e instalación
- **Manifest:** vive en `src/app/manifest.ts` y se sirve en `/manifest.webmanifest`. No duplicar nombre, colores ni íconos a mano.
- **URL pública:** `SITE_URL` se resuelve con `resolveSiteUrl` en `src/lib/site-url.ts` y se expone desde `src/lib/site.server.ts`. Nunca importar variables de servidor desde componentes cliente.
- **Service worker:** `public/sw.js` es la única capa de caché. No cachear RSC (`?_rsc=` o header `RSC`), `/api/`, POST ni cross-origin. Subir `CACHE_VERSION` al cambiar estrategias, rutas precacheadas o nombres de caché.
- **Offline:** se precachean `/`, `/offline` y los chunks que referencian esos HTML. Las rutas no visitadas redirigen a `/offline` para que Next hidrate la URL correcta; nunca servir HTML de otra ruta sin redirección.
- **Registro:** el service worker se registra solo en producción y con soporte del navegador. Si el registro falla, la app debe seguir funcionando.
- **Instalación:** botón en header de escritorio y menú móvil; iOS muestra instrucciones manuales. La instalación requiere HTTPS (`localhost` es la excepción).
- **UI PWA:** los avisos de instalación, actualización y sin conexión usan tokens de tema; no introducir superficies fijas ni opacidades menores a las permitidas.
- **Íconos:** se generan desde `public/brand/river-crest.svg` con `pnpm generate:icons` (Chromium de Playwright, sin dependencias nuevas). No editarlos a mano.
- **Verificación PWA:** todo cambio debe pasar por `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build` y `pnpm test:e2e` (incluye manifest, SW, offline e iOS).
- **Deploy:** CLI manual con `pnpm dlx vercel` / `pnpm dlx vercel --prod`; no inicializar git ni GitHub salvo pedido explícito.

## Memoria 
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones tomadas. 
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su porqué) y errores a evitar. 
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte. 
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de dejarlo en la memoria. 
- No guardes nunca datos sensibles (claves, tokens, datos personales).

## Reglas de dominio / trampas conocidas
- **Manejo de fechas locales:** Las fechas y horarios de los partidos deben procesarse y mostrarse siempre en la zona horaria local del usuario (`AAAA-MM-DD` y hora local). Nunca convertir fechas de partidos a UTC puro sin ajuste local, ya que un partido nocturno en Argentina puede figurar con la fecha del día siguiente.
- **Estados de partido:** Un partido solo admite tres estados válidos: `Próximo`, `En Vivo` y `Finalizado`. La ficha técnica completa (calificaciones e incidencias) solo debe habilitarse cuando el estado sea `Finalizado` o `En Vivo`.
- **Escala de calificaciones:** El rendimiento individual de jugadores y DT se evalúa estrictamente en una escala numérica del `1` al `10` (con hasta 1 decimal para promedios).

## Forma de trabajar
- **Flujo SDD obligatorio:** Antes de escribir código para una funcionalidad nueva, verificar o redactar su especificación en `specs/<numero>-<nombre>/spec.md`, seguida del plan técnico (`plan.md`) y el desglose de tareas (`tasks.md`).
- **Cambios atómicos:** Implementar una tarea (`T1`, `T2`, etc.) a la vez, escribiendo primero sus pruebas unitarias correspondientes antes de pasar a la interfaz.
- **Reporte al finalizar:** Explicar brevemente qué archivos se crearon o modificaron, qué lógica se implementó y confirmar que la suite de pruebas pasa sin errores.
- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código. 

## Límites
- ✅ **Siempre:**
  - Ejecutar `pnpm test` y `pnpm lint` tras modificar lógica de negocio o componentes clave.
  - Mantener el diseño *mobile-first* y responsive en todas las vistas.
  - Usar `pnpm` como único gestor de paquetes.
  - Antes cualquier duda realizar las preguntas nesesarias
  - actualizar `MEMORY.md` al terminar cada tarea.
- ⚠️ **Pregunta antes:**
  - Instalar nuevas dependencias externas (`pnpm add ...`).
  - Modificar la estructura de datos base de partidos, jugadores o noticias.
  - Alterar archivos de configuración raíz (`next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`).
- 🚫 **Nunca:**
  - Hacer "vibe coding" creando componentes masivos sin pasar por `specs/`.
  - Borrar o sobrescribir archivos dentro de `.next/`, `coverage/` o `test-results/` manualmente.
  - Mezclar llamadas a APIs o lógica de cálculo complejo directamente dentro de archivos JSX/TSX de presentación.
  - No suponer cosas que pueden estas bien

## Verificación
1. Ejecutar `pnpm test` y verificar que el 100% de las pruebas unitarias de lógica pura pasen en verde.
2. Ejecutar `pnpm lint` y confirmar que no existan advertencias ni errores de TypeScript/ESLint.
3. Si hubo cambios visuales o de flujo de usuario, ejecutar `pnpm exec playwright test` o levantar `pnpm dev` para validar el renderizado correcto en vista móvil y escritorio.