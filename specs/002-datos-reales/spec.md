---
feature: 002-datos-reales
titulo: "Mundo River — Datos reales de partidos, plantel y noticias"
estado: Draft
version: 0.1.0
fecha: 2026-11-13
autor: Lead Software Architect
metodologia: Spec-Driven Development (SDD)
proveedor_partidos: Bzzoiro Sports Data (plan gratuito)
proveedor_noticias: RSS (Google News + medios argentinos)
depende_de: [001-river-app]
---

# Especificación — Datos reales (v2)

> Los requisitos usan **EARS**. `DEBE` es normativo (MUST). Cada requisito tiene un ID estable.
> Esta spec no reemplaza a `001-river-app/spec.md`: la extiende para reemplazar los fixtures mock por datos reales.

## 1. Contexto

La v1 funciona, pero todos los datos de partidos, plantel y noticias son fixtures inventados:

- `src/data/fixtures/matches.ts` genera una temporada ficticia relativa al arranque del servidor.
- `src/data/fixtures/squad.ts` contiene un plantel hardcodeado que ya no coincide con el real.
- `src/data/fixtures/news.ts` contiene 12 notas inventadas.
- Los repositorios solo leen esos fixtures; no existe ninguna integración externa.

El resultado es que el sitio muestra datos viejos o ficticios aunque la app esté correcta.

## 2. Objetivos

| ID | Objetivo | Métrica |
|----|----------|---------|
| O-01 | Partidos y resultados reales | 100 % de los partidos de River en competiciones cubiertas |
| O-02 | Match Center real | Incidencias, stats, formaciones y notas por jugador cuando el proveedor las tenga |
| O-03 | Plantel real | Dorsales, posiciones, disponibilidad y lesiones sincronizados |
| O-04 | Noticias reales | Titulares y bajadas con enlace a la fuente, sin copiar la nota completa |
| O-05 | Cero regresiones | Dominio puro, tests y E2E siguen en verde; modo mock disponible |

## 3. Alcance

### En alcance

- Adaptador server-side para **Bzzoiro Sports Data** (plan gratuito, 7.500 req/día).
- Partidos, equipos, competiciones, temporada, incidencias, estadísticas, formaciones, H2H y calificaciones.
- Plantel real y agregación de estadísticas por jugador para la ficha de temporada.
- Agregador RSS de noticias con atribución y enlace externo.
- Caché, reintentos, single-flight, snapshots de respaldo y modo mock.
- Ajustes mínimos de tipos, repositorios, páginas y UI.

### Fuera de alcance

- Panel de administración o edición manual de datos.
- Base de datos propia; se usa caché de Next + snapshots JSON.
- Copiar el cuerpo completo de notas de terceros.
- WebSockets en tiempo real (se mantiene el polling cada 30 s).
- Escudos oficiales: se mantienen los placeholders y la identificación por colores/iniciales.

## 4. Historias de usuario

- **US-08** Como hincha, quiero ver el próximo partido, el último resultado y el calendario real para seguir la temporada actual.
- **US-09** Como hincha, quiero abrir la ficha de un partido y ver incidencias, estadísticas, formaciones y notas reales.
- **US-10** Como hincha, quiero que el plantel y los rankings de temporada reflejen a los jugadores actuales.
- **US-11** Como hincha, quiero leer titulares reales de River y poder abrir la nota en el medio original.

## 5. Requisitos funcionales

### 5.1 Proveedor de partidos

- **FR-101** El sistema DEBE consultar Bzzoiro solo desde el servidor; el navegador NO DEBE llamar al proveedor ni recibir el token.
- **FR-102** El token DEBE leerse de `BZZOIRO_TOKEN` (server-side) y NUNCA usar prefijo `NEXT_PUBLIC_`.
- **FR-103** El adaptador DEBE normalizar la respuesta al contrato interno (`Match`, `Team`, `Competition`, `Season`, `MatchEvent`, `TeamMatchStats`, `Lineup`, `PlayerMatchStats`).
- **FR-104** Los IDs internos DEBEN ser deterministas e idempotentes (`bzzoiro:<idExterno>` o el ID canónico existente) y no depender del nombre.
- **FR-105** Equipos, competiciones y temporada DEBEN derivarse del proveedor; la UI NO DEBE importar fixtures para datos de temporada.
- **FR-106** El estado del partido DEBE tomarse del proveedor cuando exista (`scheduled`, `live`, `halftime`, `finished`, `postponed`, `suspended`, `cancelled`).
- **FR-107** SI el proveedor no informa el estado, ENTONCES se DEBE usar `deriveMatchStatus` como respaldo.
- **FR-108** El minuto en vivo DEBE tomarse del proveedor cuando exista; en su defecto se calcula con `computeMatchMinute`.
- **FR-109** La ficha DEBE mostrar incidencias, estadísticas, formaciones, H2H y calificaciones solo cuando el proveedor tenga datos; en caso contrario DEBE mostrar el estado vacío correspondiente.
- **FR-110** Las calificaciones DEBEN normalizarse a la escala 1-10 con un decimal; `null` se muestra como `SC`.
- **FR-111** El plantel DEBE incluir dorsal, posición, nacionalidad, disponibilidad y lesión cuando existan.
- **FR-112** Los rankings y totales de temporada DEBEN calcularse con los mismos eventos y estadísticas que las fichas de partido.
- **FR-113** SI el proveedor falla, expira o devuelve un payload inválido, ENTONCES se DEBE servir el último snapshot válido y mostrar un aviso no bloqueante.
- **FR-114** El sistema DEBE limitar las llamadas con caché, single-flight, timeout de 5 s y hasta 3 reintentos con backoff.
- **FR-115** Las competiciones no cubiertas por el proveedor (por ejemplo Copa Argentina) NO DEBEN mostrarse como filtros vacíos; la UI se adapta a lo disponible.

### 5.2 Noticias

- **FR-116** El sistema DEBE obtener noticias desde feeds RSS configurables y filtrar por River.
- **FR-117** Cada noticia DEBE incluir titular, bajada, fuente, fecha ISO y enlace externo.
- **FR-118** El detalle DEBE mostrar solo el resumen y un enlace “Leer en la fuente”; NO DEBE copiar el cuerpo completo.
- **FR-119** Las noticias DEBEN deduplicarse por titular normalizado y ordenarse por fecha descendente.
- **FR-120** La categoría DEBE derivarse por palabras clave; si no hay coincidencia, se usa `institucional`.
- **FR-121** La UI DEBE mostrar la atribución de la fuente y mantener el descargo de sitio no oficial.

### 5.3 Modos y calidad

- **FR-122** El sistema DEBE soportar `DATA_MODE=mock|live`; los tests y E2E DEBEN usar `mock`.
- **FR-123** Los tests del adaptador DEBEN usar payloads grabados; el CI NO DEBE llamar a proveedores reales.
- **FR-124** Las fechas DEBEN seguir las reglas de `001-river-app` (`Intl` + `timeZone` explícito, claves `AAAA-MM-DD`).
- **FR-125** SI no hay próximo partido, ENTONCES la home DEBE mostrar el último resultado y un acceso al calendario, sin errores.
- **FR-126** La app DEBE indicar la fuente de los datos y la fecha de última actualización.

## 6. Reglas de negocio

- **R-DATA-01** Estado: proveedor > `statusOverride` > derivación por reloj.
- **R-DATA-02** Minuto: proveedor > `computeMatchMinute`.
- **R-DATA-03** Rating: `normalizeRating`; fuera de 1-10 o `null` ⇒ `SC`.
- **R-DATA-04** Noticias: solo titular, bajada y enlace; nunca el cuerpo completo.
- **R-DATA-05** IDs: el ID canónico no cambia si cambia el nombre o el dorsal.
- **R-DATA-06** Caché: vivo 15-30 s; listado 5 min; detalle 10 min; plantel 6 h; noticias 5 min.

## 7. Cambios de modelo

| Tipo | Cambio | Motivo |
|------|--------|--------|
| `Match` | `providerStatus?: MatchStatus` | Usar el estado real sin depender del reloj |
| `Match` | `providerMinute?: number` | Mostrar el minuto real en vivo |
| `NewsArticle` | `externalUrl?: string` | Enlace a la fuente |
| `NewsArticle` | `sourceName?: string` | Atribución |
| `MatchesRepository` | `listPlayerStats(): Promise<PlayerMatchStats[]>` | Evitar N+1 y alimentar la temporada |
| `NewsArticle` | `body` se mantiene | Compatibilidad con la UI; se llena con la bajada |

## 8. Requisitos no funcionales

- **NFR-101** El token y las URLs internas del proveedor NUNCA se exponen al cliente ni se registran en logs.
- **NFR-102** Las llamadas externas tienen timeout, reintentos y un límite de concurrencia.
- **NFR-103** Los snapshots se validan con el mismo esquema Zod que la respuesta viva.
- **NFR-104** La cobertura de `src/domain/**` se mantiene por encima de los umbrales actuales.
- **NFR-105** La accesibilidad, el responsive 360 px+ y el SEO existentes no se degradan.
- **NFR-106** El sitio sigue funcionando sin conexión usando snapshots/mock, con aviso visible.

## 9. Criterios de aceptación

1. Con token válido, la home muestra un partido real (próximo o último) y el calendario refleja la temporada real.
2. La ficha de un partido finalizado muestra marcador, incidencias, estadísticas, formaciones y calificaciones reales cuando existan.
3. El plantel muestra jugadores reales con dorsal y posición; la temporada calcula goleadores/asistentes con esos datos.
4. Novedades muestra titulares reales, fuente y fecha, y el detalle enlaza al medio original.
5. Sin token o con el proveedor caído, la app sirve el snapshot/mock y muestra un aviso no bloqueante.
6. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` y `pnpm test:e2e` pasan en verde.

## 10. Riesgos y supuestos

- **Cobertura**: Bzzoiro no parece cubrir Copa Argentina ni Trofeo de Campeones. Se verificará con el token; si falta, se omite la competición o se evalúa un segundo proveedor.
- **Escala de rating**: se debe confirmar el rango real (1-10) con una respuesta real.
- **Estabilidad**: proveedor indie; se mitiga con snapshots y modo mock.
- **Noticias**: los feeds pueden cambiar de formato; el parser debe tolerar errores y omitir ítems inválidos.
- **Derechos**: se muestran solo titulares, bajadas y enlaces, con atribución.

## 11. Preguntas abiertas

- ¿Copa Argentina es obligatoria? (pendiente de verificar cobertura).
- ¿Se acepta `fast-xml-parser` como dependencia para los RSS?
- ¿La app se publica en un dominio público o queda como demo local? (define si hace falta licenciar noticias).
