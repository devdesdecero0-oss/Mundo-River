---
feature: 003-modo-oscuro
documento: spec
estado: Aprobado
version: 1.0.0
fecha: 2026-11-16
---

# Especificación — Modo oscuro integral

## Objetivo

Permitir que cualquier visitante alterne entre un tema claro y un tema oscuro en todo el sitio, con preferencia persistente, sin parpadeo al cargar y respetando la identidad visual de River Plate.

## Alcance

- Todas las rutas: Inicio, Novedades, Calendario, Match Center, Temporada, loading, error y 404.
- Componentes compartidos: header, footer, tarjetas, chips, badges de estado, tablas, formularios, skeletons, overlays y paneles.
- Preferencia inicial: la guardada en cookie; si no existe, `prefers-color-scheme`.
- Control: botón simple claro ↔ oscuro en el header, accesible por teclado.
- Persistencia: cookie `mr_theme` con un año de vigencia.
- Sincronización entre pestañas con `BroadcastChannel` cuando el navegador lo soporte.

## Fuera de alcance

- Cambios en dominio, datos, proveedores o repositorios.
- Temas personalizados por usuario más allá de claro/oscuro.
- Modo “sistema” explícito en la interfaz.
- Dependencias nuevas.

## Requisitos funcionales

- **FR-001** El sitio arranca en el tema guardado en `mr_theme`; sin cookie, sigue el sistema operativo.
- **FR-002** El botón alterna el tema al instante sin recargar.
- **FR-003** La elección se persiste y sobrevive recargas y navegaciones.
- **FR-004** Si cambia el tema del sistema y el usuario nunca eligió, el sitio se actualiza.
- **FR-005** Al alternar en una pestaña, las demás pestañas abiertas del sitio se actualizan.
- **FR-006** No hay destello del tema incorrecto en el primer render.

## Requisitos no funcionales

- **NFR-001** Contraste AA en textos y controles en ambos temas.
- **NFR-002** El botón expone estado y acción a lectores de pantalla.
- **NFR-003** `color-scheme` y `theme-color` acompañan al tema activo.
- **NFR-004** Se respeta `prefers-reduced-motion`.
- **NFR-005** El tema no altera el rojo institucional de las superficies; solo se aclara el rojo de texto cuando hace falta contraste.

## Criterios de aceptación

- Activar oscuro en la home y recargar mantiene el tema.
- El tema se mantiene al navegar entre secciones.
- Loading, error y 404 no muestran fondos blancos inesperados.
- Los estados aplazado/suspendido, las calificaciones `SC`, las barras y el campo de juego siguen legibles.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` y `pnpm test:e2e` pasan.
