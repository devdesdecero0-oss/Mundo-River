---
feature: 001-river-app
titulo: "Mundo River — Centro de información y Match Center"
estado: Draft
version: 0.2.0
fecha: 2026-11-11
autor: Lead Software Architect
metodologia: Spec-Driven Development (SDD)
stack_validado: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
datos_v1: Mock tipado para partidos/noticias + plantel desde proveedor externo
marca: Escudo oficial de River Plate
depende_de: []
---

# Especificación — Mundo River (v1)

> **Notación:** los requisitos funcionales usan **EARS** (Easy Approach to Requirements Syntax).
> `DEBE` es normativo (equivalente a MUST). Cada requisito tiene un ID estable y verificable.

---

## Índice

1. [Contexto](#1-contexto)
2. [Objetivos y métricas de éxito](#2-objetivos-y-métricas-de-éxito)
3. [Alcance](#3-alcance)
4. [Personas](#4-personas)
5. [Glosario](#5-glosario)
6. [Historias de usuario](#6-historias-de-usuario)
7. [Requisitos funcionales (EARS)](#7-requisitos-funcionales-ears)
8. [Reglas de negocio y funciones puras](#8-reglas-de-negocio-y-funciones-puras)
9. [Modelo conceptual de datos](#9-modelo-conceptual-de-datos)
10. [Requisitos no funcionales](#10-requisitos-no-funcionales)
11. [Criterios de aceptación y Definition of Done](#11-criterios-de-aceptación-y-definition-of-done)
12. [Fuera de alcance](#12-fuera-de-alcance)
13. [Supuestos y decisiones](#13-supuestos-y-decisiones)
14. [Riesgos](#14-riesgos)
15. [Trazabilidad](#15-trazabilidad)
16. [Preguntas abiertas](#16-preguntas-abiertas)

---

## 1. Contexto

### 1.1 Situación actual

El hincha de River Plate consume información del club en fuentes dispersas: redes sociales, portales de noticias, apps de resultados y transmisiones. Cada fuente publica con criterios distintos y ninguna ofrece una ficha post-partido completa (incidencias + comparativa estadística + calificaciones individuales) junto con el archivo de la temporada en curso.

### 1.2 Problema

| # | Problema | Impacto |
|---|----------|---------|
| P1 | Información fragmentada entre noticias, calendario y estadísticas | El usuario debe abrir 3–4 apps para entender un partido |
| P2 | Fichas post-partido pobres: solo resultado o solo estadísticas agregadas | No se puede analizar el rendimiento individual ni el desarrollo del juego |
| P3 | Desfasaje de fechas/horarios por manipulación de UTC | Partidos mostrados en el día equivocado (especialmente kickoffs nocturnos) |
| P4 | Experiencias móviles lentas, con loaders y saltos de layout | Abandono en el momento de mayor tráfico (minutos previos y posteriores al partido) |
| P5 | Falta de filtros reales por categoría y competición | El contenido relevante queda enterrado |
| P6 | Planteles desactualizados o cargados a mano | Formaciones y estadísticas individuales inconsistentes |

### 1.3 Propuesta de valor

**Mundo River** es un centro de información deportiva e institucional, mobile-first y de alto rendimiento, que unifica:

- Un **feed de novedades** filtrable y cronológico.
- Un **calendario de temporada** con estado de partido en tiempo real.
- Un **Match Center** pre-partido, en vivo y post-partido, con ficha técnica completa y calificaciones individuales.
- Una **ficha histórica de la temporada** con máximos goleadores, asistentes y registro del equipo.
- Una **plantilla sincronizada desde un proveedor de datos**, con identidad visual oficial del club (escudo oficial).

### 1.4 Principios de producto

1. **Velocidad primero:** la información crítica debe verse sin esperas ni interacción.
2. **Un solo origen de verdad:** el estado del partido se deriva de una regla explícita y testeable.
3. **Cero desfasaje horario:** toda fecha se presenta en la zona horaria del usuario.
4. **Identidad oficial:** el escudo del club se usa con fidelidad, sin alteraciones y con respaldo visual.
5. **Modular para escalar:** dominio puro separado de UI e infraestructura, con specs independientes por módulo.

---

## 2. Objetivos y métricas de éxito

### 2.1 Objetivos de producto

| ID | Objetivo | Métrica | Meta v1 |
|----|----------|---------|---------|
| O-01 | Entender el próximo partido en segundos | Tiempo hasta ver kickoff + rival + competencia | ≤ 3 s desde la home |
| O-02 | Consultar el feed con filtros instantáneos | Latencia de filtrado percibida | < 100 ms (client-side) |
| O-03 | Analizar un partido finalizado | Pasos para llegar a calificaciones | ≤ 2 clics desde calendario |
| O-04 | Conocer al goleador/asistente de la temporada | Acceso desde home y desde `/temporada` | 1 clic |
| O-05 | Experiencia fluida en móvil | LCP p75 en 4G / INP / CLS | ≤ 2,0 s / ≤ 200 ms / ≤ 0,05 |
| O-06 | Plantilla siempre confiable | Cobertura de jugadores normalizados usados en formaciones | 100 % |

### 2.2 Criterios de éxito medibles (SC)

- **SC-001:** el 100 % de las fechas visibles coincide con la zona horaria del dispositivo (verificado con matriz de tests y clock fijo en E2E).
- **SC-002:** un partido con kickoff `2026-03-15T01:30:00Z` se muestra el **14 de marzo** en `America/Argentina/Buenos_Aires` (22:30) y el **15 de marzo** en `Europe/Madrid` (02:30).
- **SC-003:** los filtros de Novedades y Calendario se reflejan en la URL y sobreviven a recarga/compartición.
- **SC-004:** cobertura de ramas ≥ 95 % en `src/domain/**` y 100 % de las funciones puras con al menos un caso borde documentado.
- **SC-005:** Lighthouse ≥ 95 en Performance, Accessibility, Best Practices y SEO en `/`, `/novedades`, `/calendario` y `/partidos/[id]` (build de producción, mobile).
- **SC-006:** cero violaciones *critical* o *serious* de axe-core en las 4 rutas anteriores.
- **SC-007:** los datos mostrados en la ficha de temporada coinciden al 100 % con la suma de eventos de las fichas de partido (test de consistencia sobre los fixtures).
- **SC-008:** ningún módulo de `src/domain` importa React, Next.js, red o almacenamiento (test de arquitectura).
- **SC-009:** el 100 % de los jugadores referenciados en formaciones y eventos existe en la plantilla normalizada; ante caída del proveedor, la app sirve el último snapshot válido sin errores visibles.
- **SC-010:** el escudo oficial se renderiza sin deformación, con texto alternativo y sin CLS; el fallback monocromático se activa correctamente cuando el asset no carga.

---

## 3. Alcance

### 3.1 En alcance (v1)

| Módulo | Incluye |
|--------|---------|
| Novedades | Feed cronológico, filtro por 4 categorías, detalle de artículo, tiempo de lectura, paginación |
| Calendario | Vista mes y agenda, filtros por competición/mes/estado, navegación de temporada, estados Próximo / En Vivo / Finalizado |
| Match Center | Previa (countdown, formaciones probables, H2H, ausencias), live (marcador, minuto, eventos, auto-refresh), post (incidencias, estadísticas comparativas, formaciones, calificaciones, MVP) |
| Temporada | Máximo goleador, máximo asistente, top 5 de cada ranking, registro del equipo (PJ/PG/PE/PP/GF/GC/DG), racha, últimos 5, local/visitante |
| Plantel | Sincronización desde proveedor externo, normalización a contrato interno, caché con revalidación, snapshot de respaldo y resolución de jugadores |
| Marca | Escudo oficial en header, home, fichas y estados de carga, con variantes de tamaño y fallback monocromático |
| Transversal | Zona horaria local, responsive 360→1440+, accesibilidad AA, SEO, estados vacíos/error, datos mock tipados con repositorio intercambiable |

### 3.2 Fuera de alcance (v1)

Ver [§12](#12-fuera-de-alcance).

---

## 4. Personas

| Persona | Contexto | Necesidad principal |
|---------|----------|---------------------|
| **El Hincha Express** (móvil, 20–35) | Camino al trabajo, 30–90 s por sesión | Ver próximo partido, resultado y últimas 3 noticias sin fricción |
| **El Analista de Tribuna** (desktop/móvil, 25–45) | Post-partido, 5–15 min | Incidencias, stats comparativas y notas individuales |
| **La Seguidora de Inferiores** (móvil, 18–40) | Busca categorías específicas | Filtrar novedades por Inferiores y Mercado de Pases |
| **El Coleccionista de Datos** (desktop, 20–50) | Consulta recurrente | Récords de temporada: goleador, asistente, racha, efectividad |

---

## 5. Glosario

| Término | Definición |
|---------|------------|
| **Instante** | Punto en el tiempo absoluto, almacenado en ISO-8601 UTC (`2026-03-15T01:30:00.000Z`) |
| **Fecha local** | Día calendario en la zona horaria del usuario, clave `AAAA-MM-DD` |
| **Kickoff** | Instante de inicio del partido |
| **Partido derivado** | Partido cuyo estado se calcula por regla temporal, sin estado explícito en la fuente |
| **Ficha técnica** | Vista post-partido con resultado, incidencias, estadísticas y calificaciones |
| **MVP del partido** | Jugador con la calificación más alta según desempate definido (R-RATING) |
| **Temporada activa** | Temporada configurada como vigente (por defecto, año calendario en curso) |
| **SC** | *Sin calificar*: rendimiento individual no disponible (`rating = null`) |
| **Efectividad** | Puntos obtenidos / puntos disputados en competiciones de liga |
| **Proveedor de datos** | Servicio externo que expone plantel y datos biográficos/deportivos de los jugadores |
| **Payload crudo** | Respuesta del proveedor antes de normalizarse al contrato interno |
| **Plantilla normalizada** | Lista de `Player` + `SquadMembership` con IDs canónicos, validada por Zod |
| **ID canónico** | Identificador interno estable derivado de `proveedor + idExterno`, inmune a cambios de nombre |
| **Snapshot** | Copia local validada de la última plantilla obtenida con éxito; se usa como respaldo |
| **Escudo oficial** | Activo de marca provisto por el club, usado sin alterar colores, proporciones ni recortes |

---

## 6. Historias de usuario

> Prioridades: **P1** = imprescindible para v1 · **P2** = importante, entra si P1 está cerrado · **P3** = futura.

### US-01 — Feed de Novedades filtrable (P1)

**Como** hincha, **quiero** ver las novedades ordenadas de la más reciente a la más antigua y filtrarlas por categoría, **para** encontrar rápido lo que me interesa sin recorrer contenido irrelevante.

**Valor:** reduce el tiempo de descubrimiento y permite compartir una vista filtrada por URL.

**Escenarios de aceptación**

1. **Dado** que existen artículos de las 4 categorías, **cuando** abro `/novedades`, **entonces** veo el feed ordenado por `publishedAt` descendente con la categoría «Todas» activa.
2. **Dado** que estoy en el feed, **cuando** selecciono «Inferiores», **entonces** solo veo artículos de esa categoría, la URL pasa a `?cat=inferiores` y el foco se mantiene en el control de filtro.
3. **Dado** un filtro sin resultados, **cuando** se aplica, **entonces** veo un estado vacío con la acción «Ver todas las novedades».
4. **Dado** un artículo abierto, **cuando** lo comparto, **entonces** el enlace incluye slug canónico y metadatos Open Graph.

**Requisitos:** FR-010 … FR-019.

---

### US-02 — Calendario de temporada con estados (P1)

**Como** hincha, **quiero** ver todos los partidos de la temporada en un calendario filtrable y saber si un partido es próximo, está en vivo o finalizó, **para** planificar mi agenda y no perderme ningún partido.

**Valor:** centraliza la temporada y elimina la ambigüedad de husos horarios.

**Escenarios de aceptación**

1. **Dado** que la temporada tiene partidos de Liga, Copa y Libertadores, **cuando** abro `/calendario`, **entonces** veo el filtro «Todas» y las competiciones derivadas de los datos (sin listas hardcodeadas).
2. **Dado** un partido en curso, **cuando** visualizo el calendario, **entonces** aparece destacado con badge «EN VIVO» y texto accesible, no solo color.
3. **Dado** un partido con kickoff nocturno, **cuando** lo veo desde mi zona horaria, **entonces** aparece en el día local correcto y agrupado bajo ese encabezado.
4. **Dado** un filtro de mes sin partidos, **cuando** se aplica, **entonces** veo un estado vacío con «Limpiar filtros» y el mes se mantiene navegable.

**Requisitos:** FR-020 … FR-029.

---

### US-03 — Match Center pre-partido y en vivo (P1)

**Como** hincha, **quiero** entrar a la ficha del partido antes y durante el juego para ver countdown, formaciones y eventos en tiempo casi real, **para** seguir el partido sin cambiar de aplicación.

**Valor:** retención durante la ventana de mayor tráfico.

**Escenarios de aceptación**

1. **Dado** un partido futuro, **cuando** abro `/partidos/{id}`, **entonces** veo countdown local, sede, árbitro, TV, historial H2H y formaciones probables.
2. **Dado** un partido en vivo, **cuando** permanezco en la ficha, **entonces** el marcador y los eventos se actualizan cada 30 s y se indica «Actualizado hace X s».
3. **Dado** que la pestaña del navegador queda oculta, **cuando** vuelvo a ella, **entonces** se reanuda la actualización y se refresca inmediatamente.
4. **Dado** un lector de pantalla, **cuando** se produce un gol, **entonces** se anuncia de forma cortés (`aria-live="polite"`) sin robar el foco.

**Requisitos:** FR-030 … FR-041.

---

### US-04 — Ficha técnica post-partido (P1)

**Como** analista, **quiero** revisar el resultado, las incidencias, las estadísticas comparativas y la calificación de cada jugador, **para** entender cómo se jugó y quién rindió mejor.

**Valor:** diferenciador central frente a apps de solo resultados.

**Escenarios de aceptación**

1. **Dado** un partido finalizado, **cuando** abro la ficha, **entonces** veo resultado, goleadores, tarjetas y cambios con minuto y jugador.
2. **Dado** la pestaña «Estadísticas», **cuando** la abro, **entonces** veo posesión, tiros, tiros al arco, córners y faltas con barras comparativas y valores numéricos.
3. **Dado** la pestaña «Calificaciones», **cuando** la abro, **entonces** veo una nota de 1,0 a 10,0 por jugador (o «SC»), el MVP destacado y el promedio del equipo.
4. **Dado** un partido suspendido, **cuando** abro la ficha, **entonces** veo el motivo y no se muestran estadísticas inventadas.

**Requisitos:** FR-042 … FR-050.

---

### US-05 — Ficha histórica de la temporada (P2)

**Como** coleccionista de datos, **quiero** ver al máximo goleador y asistente de la temporada, junto con el registro del equipo, **para** seguir la campaña sin sumar números a mano.

**Valor:** fidelización y contenido recurrente.

**Escenarios de aceptación**

1. **Dado** la temporada activa, **cuando** abro `/temporada`, **entonces** veo goleador y asistente con foto, goles/asistencias y partidos jugados.
2. **Dado** un empate en goles, **cuando** se calcula el ranking, **entonces** se aplica el desempate documentado (R-RANK) y se indica «empate técnico».
3. **Dado** el filtro «Copa Libertadores», **cuando** se aplica, **entonces** rankings y registro se recalculan solo con esa competición.

**Requisitos:** FR-051 … FR-060.

---

### US-06 — Experiencia consistente y rápida (P2)

**Como** usuario en cualquier dispositivo, **quiero** que la app cargue rápido, respete mi zona horaria y funcione con teclado y lector de pantalla, **para** usarla en cualquier contexto.

**Requisitos:** FR-001 … FR-009, FR-061 … FR-065 y NFR-001 … NFR-029.

---

### US-07 — Plantel confiable desde el proveedor (P1)

**Como** hincha, **quiero** que la plantilla, los dorsales, las posiciones y las fotos estén siempre actualizados, **para** que las formaciones y las estadísticas individuales sean correctas.

**Valor:** sin plantel confiable no hay fichas técnicas ni rankings creíbles.

**Escenarios de aceptación**

1. **Dado** que el proveedor responde correctamente, **cuando** se consulta la plantilla, **entonces** todos los jugadores se muestran normalizados (ID canónico, nombre, dorsal, posición, nacionalidad, foto y contrato si existe).
2. **Dado** que el proveedor está caído o devuelve un error, **cuando** un usuario abre una ficha, **entonces** la app sirve el último snapshot válido y muestra un aviso no bloqueante.
3. **Dado** un jugador del proveedor con datos obligatorios incompletos, **cuando** se normaliza el payload, **entonces** se omite ese jugador, se registra la inconsistencia y el resto de la plantilla se muestra normalmente.
4. **Dado** un cambio de dorsal o un alta/baja en el proveedor, **cuando** se revalida la caché, **entonces** el cambio se refleja sin necesidad de un nuevo deploy.

**Requisitos:** FR-066 … FR-075.

---

## 7. Requisitos funcionales (EARS)

### 7.1 Transversal — Fechas y zona horaria

- **FR-001 (Ubicuo)** El sistema DEBE almacenar y transportar todos los instantes (kickoff, publicación, eventos, actualizaciones) en ISO-8601 con zona UTC u offset explícito.
- **FR-002 (Ubicuo)** El sistema DEBE presentar toda fecha y hora en la zona horaria del dispositivo del usuario, obtenida de `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- **FR-003 (Ubicuo)** El sistema NO DEBE derivar fechas locales mediante `toISOString()`, `getDate()`, `getMonth()` o `getDay()` en código de dominio o presentación; DEBE usar `Intl.DateTimeFormat` con `timeZone` explícito.
- **FR-004 (Evento)** CUANDO el usuario recarga la aplicación con otra zona horaria configurada, el sistema DEBE reagrupar partidos y reetiquetar fechas en la nueva zona.
- **FR-005 (Estado)** MIENTRAS se renderiza en servidor, el sistema DEBE usar `America/Argentina/Buenos_Aires` como zona de respaldo y reconciliar en cliente sin errores de hidratación.
- **FR-006 (Ubicuo)** El sistema DEBE mostrar fechas en formato `es-AR` (por ejemplo, «sáb 14 mar · 22:30») y encabezados relativos («Hoy», «Mañana», «Sábado 14 de marzo»).
- **FR-007 (Ubicuo)** El sistema DEBE exponer las fechas locales como claves `AAAA-MM-DD` para filtros, agrupaciones y parámetros de URL.
- **FR-008 (Evento)** CUANDO un kickoff ocurra cerca de la medianoche, el sistema DEBE asignarlo al día local del kickoff y no al día UTC.
- **FR-009 (Ubicuo)** Toda función pura de fecha DEBE recibir `timeZone` como parámetro explícito y NO DEBE leer configuración global ni el reloj del sistema.

### 7.2 Novedades

- **FR-010 (Ubicuo)** El sistema DEBE mostrar un feed de artículos ordenado por `publishedAt` descendente con desempate estable por `id`.
- **FR-011 (Evento)** CUANDO el usuario selecciona una categoría, el sistema DEBE filtrar el feed y reflejar la selección en la URL mediante `?cat={slug}`.
- **FR-012 (Ubicuo)** El sistema DEBE soportar las categorías `plantel-profesional`, `inferiores`, `institucional` y `mercado-de-pases`, más la opción «Todas», derivando los conteos de los datos disponibles.
- **FR-013 (Ubicuo)** Cada tarjeta del feed DEBE mostrar título, extracto, imagen de portada, categoría, fecha local y tiempo de lectura.
- **FR-014 (Evento)** CUANDO el usuario abre un artículo, el sistema DEBE mostrar el detalle en `/novedades/{slug}` con cuerpo enriquecido, autor, fecha local y artículos relacionados.
- **FR-015 (Opcional)** DONDE el usuario escriba en el buscador, el sistema DEBE filtrar por título, extracto y etiquetas sin distinguir mayúsculas ni acentos.
- **FR-016 (Evento)** CUANDO el usuario solicita «Cargar más», el sistema DEBE anexar la siguiente página sin duplicar artículos ya visibles.
- **FR-017 (Ubicuo)** El tiempo de lectura DEBE calcularse como `max(1, ceil(palabras / 200))` sobre el texto plano del cuerpo.
- **FR-018 (Evento)** CUANDO cambia el filtro activo, el sistema DEBE desplazar el foco al inicio del feed y anunciar el resultado a tecnologías de asistencia.
- **FR-019 (No deseado)** SI no existen artículos para el filtro, ENTONCES el sistema DEBE mostrar un estado vacío con copy explicativo y la acción «Ver todas las novedades».

### 7.3 Calendario

- **FR-020 (Ubicuo)** El sistema DEBE ofrecer dos vistas conmutables: «Mes» (grilla) y «Agenda» (lista cronológica).
- **FR-021 (Ubicuo)** El sistema DEBE derivar las competiciones disponibles desde los datos de la temporada y ofrecer «Todas» como opción por defecto.
- **FR-022 (Ubicuo)** El sistema DEBE permitir combinar filtros de competición, mes y estado, y reflejarlos en la URL.
- **FR-023 (Ubicuo)** El sistema DEBE representar el estado del partido con color, texto e ícono («Próximo», «En Vivo», «Finalizado», «Aplazado», «Suspendido»).
- **FR-024 (Evento)** CUANDO el usuario navega entre meses, el sistema DEBE preservar los filtros activos.
- **FR-025 (Ubicuo)** El sistema DEBE agrupar y ordenar los partidos por fecha local ascendente en Agenda y por día en la grilla mensual.
- **FR-026 (Estado)** MIENTRAS exista un partido en vivo, el sistema DEBE destacarlo al inicio del día correspondiente con indicador «EN VIVO».
- **FR-027 (Evento)** CUANDO el usuario selecciona un partido, el sistema DEBE navegar a `/partidos/{id}` conservando un enlace canónico.
- **FR-028 (No deseado)** SI el filtro no devuelve partidos, ENTONCES el sistema DEBE mostrar un estado vacío con la acción «Limpiar filtros».
- **FR-029 (Ubicuo)** El sistema DEBE marcar visualmente los días con partidos en la grilla y permitir navegar a ellos con teclado.

### 7.4 Match Center — Pre-partido y en vivo

- **FR-030 (Ubicuo)** El sistema DEBE exponer una ficha en `/partidos/{id}` para todo partido de la temporada, adaptando su contenido al estado.
- **FR-031 (Estado)** MIENTRAS el partido esté «Próximo», el sistema DEBE mostrar cuenta regresiva local, sede, árbitro, transmisión, historial de los últimos 5 enfrentamientos, formaciones probables y ausencias.
- **FR-032 (Estado)** MIENTRAS el partido esté «En Vivo», el sistema DEBE mostrar marcador, minuto, eventos y última actualización, refrescando cada 30 segundos.
- **FR-033 (Evento)** CUANDO la pestaña del navegador vuelve a estar visible, el sistema DEBE refrescar inmediatamente los datos del partido y reanudar el ciclo.
- **FR-034 (Ubicuo)** La ficha DEBE organizar el contenido en pestañas accesibles: Resumen, Incidencias, Estadísticas, Formaciones y Calificaciones.
- **FR-035 (Ubicuo)** El sistema DEBE permitir enlazar directamente una pestaña mediante query param (`?tab=calificaciones`) y reflejar el cambio en la URL.
- **FR-036 (Ubicuo)** El sistema DEBE indicar el estado de actualización con texto («Actualizado hace 12 s») y un control de refresco manual.
- **FR-037 (Estado)** MIENTRAS el partido esté «En Vivo», el sistema DEBE anunciar cambios relevantes (gol, tarjeta roja) mediante una región `aria-live="polite"` sin mover el foco.
- **FR-038 (No deseado)** SI la actualización automática falla, ENTONCES el sistema DEBE conservar los últimos datos válidos, mostrar un aviso no bloqueante y permitir reintentar.
- **FR-039 (Ubicuo)** El sistema DEBE mostrar la formación en cancha con titulares, suplentes, capitán y cambios realizados.
- **FR-040 (Ubicuo)** El sistema DEBE mostrar el historial H2H agregado (victorias, empates, derrotas y goles) calculado a partir de los partidos disponibles.
- **FR-041 (No deseado)** SI el partido está aplazado, suspendido o cancelado, ENTONCES el sistema DEBE mostrar el estado y el motivo, y ocultar estadísticas y calificaciones.

### 7.5 Match Center — Ficha post-partido

- **FR-042 (Evento)** CUANDO el partido finaliza, el sistema DEBE mostrar resultado final, resultado al entretiempo y duración.
- **FR-043 (Ubicuo)** La ficha DEBE listar incidencias ordenadas por minuto: goles, penales, autogoles, tarjetas, cambios y VAR, con jugador, equipo y minuto (incluido descuento).
- **FR-044 (Ubicuo)** La ficha DEBE mostrar estadísticas comparativas de ambos equipos: posesión, tiros, tiros al arco, córners, faltas, offsides, pases y precisión de pases.
- **FR-045 (Ubicuo)** Cada estadística DEBE mostrarse con valor numérico y barra proporcional, con etiqueta accesible que incluya ambos valores.
- **FR-046 (Ubicuo)** El sistema DEBE mostrar una calificación individual de 1,0 a 10,0 con un decimal, o «SC» cuando no exista calificación.
- **FR-047 (Ubicuo)** El sistema DEBE calcular y destacar al MVP del partido según R-RATING.
- **FR-048 (Ubicuo)** El sistema DEBE permitir ordenar las calificaciones por puesto y por nota, y mostrar el promedio del equipo excluyendo jugadores «SC».
- **FR-049 (Ubicuo)** El sistema DEBE incluir minutos jugados, goles, asistencias y tarjetas por jugador en la vista de calificaciones.
- **FR-050 (No deseado)** SI un evento referencia un jugador inexistente, ENTONCES el sistema DEBE omitirlo de la vista, registrar la inconsistencia y no interrumpir el render.

### 7.6 Ficha histórica de la temporada

- **FR-051 (Ubicuo)** El sistema DEBE mostrar la temporada activa y su etiqueta (por ejemplo, «Temporada 2026»).
- **FR-052 (Ubicuo)** El sistema DEBE mostrar al máximo goleador con foto, nombre, goles, asistencias y partidos jugados.
- **FR-053 (Ubicuo)** El sistema DEBE mostrar al máximo asistente con foto, nombre, asistencias, goles y partidos jugados.
- **FR-054 (Ubicuo)** El sistema DEBE mostrar el top 5 de goleadores y el top 5 de asistentes con barras proporcionales.
- **FR-055 (Ubicuo)** El sistema DEBE mostrar el registro del equipo: partidos jugados, ganados, empatados, perdidos, goles a favor, en contra, diferencia y efectividad.
- **FR-056 (Ubicuo)** El sistema DEBE mostrar la racha actual y los últimos 5 resultados (G/E/P) en orden cronológico.
- **FR-057 (Ubicuo)** El sistema DEBE desglosar el rendimiento como local y como visitante.
- **FR-058 (Evento)** CUANDO el usuario aplica un filtro de competición, el sistema DEBE recalcular todos los rankings y el registro usando solo esa competición.
- **FR-059 (Evento)** CUANDO el usuario selecciona un jugador del ranking, el sistema DEBE abrir un panel con sus totales de temporada sin abandonar la página.
- **FR-060 (Ubicuo)** Los totales de temporada DEBEN derivarse de los mismos eventos y partidos que alimentan las fichas, garantizando consistencia (SC-007).

### 7.7 Resiliencia y estados del sistema

- **FR-061 (Estado)** MIENTRAS se cargan datos, el sistema DEBE mostrar *skeletons* con las dimensiones finales para evitar saltos de layout.
- **FR-062 (No deseado)** SI una carga falla, ENTONCES el sistema DEBE mostrar un mensaje claro, un identificador de error y la acción «Reintentar».
- **FR-063 (No deseado)** SI la ruta solicitada no existe, ENTONCES el sistema DEBE mostrar una página 404 con accesos a Inicio, Novedades y Calendario.
- **FR-064 (Ubicuo)** El sistema DEBE ofrecer estados vacíos diferenciados para «sin resultados de filtro» y «sin datos disponibles».
- **FR-065 (Estado)** MIENTRAS no exista un partido próximo, el sistema DEBE mostrar el último resultado y un enlace al calendario en la home.

### 7.8 Plantel y proveedor de datos

- **FR-066 (Ubicuo)** El sistema DEBE obtener la plantilla desde un proveedor de datos externo mediante un adaptador server-side; el navegador NO DEBE invocar al proveedor ni recibir sus credenciales.
- **FR-067 (Ubicuo)** El adaptador DEBE normalizar la respuesta del proveedor al contrato interno `Player` + `SquadMembership`, incluyendo ID canónico, nombre, dorsal, posición, nacionalidad, foto y datos de contrato cuando existan.
- **FR-068 (Ubicuo)** El sistema DEBE mapear los IDs del proveedor a IDs internos canónicos de forma determinista e idempotente, resistente a cambios de nombre o de dorsal.
- **FR-069 (Ubicuo)** El sistema DEBE cachear la plantilla normalizada con un tag `squad` y una ventana de revalidación configurable (por defecto 6 horas).
- **FR-070 (No deseado)** SI la consulta al proveedor falla, expira o devuelve un payload inválido, ENTONCES el sistema DEBE servir el último snapshot válido y mostrar un aviso no bloqueante.
- **FR-071 (No deseado)** SI un jugador no puede normalizarse por datos obligatorios faltantes, ENTONCES el sistema DEBE omitirlo, registrar la inconsistencia y continuar con el resto de la plantilla.
- **FR-072 (Ubicuo)** El sistema DEBE proteger el rate limit del proveedor mediante caché, single-flight y un máximo de 3 reintentos con backoff exponencial y timeout de 5 s.
- **FR-073 (Evento)** CUANDO el proveedor reporte altas, bajas o cambios de dorsal, el sistema DEBE reflejarlos en la siguiente revalidación sin requerir un nuevo deploy.
- **FR-074 (Ubicuo)** El sistema DEBE resolver cada jugador referenciado en formaciones y eventos contra la plantilla normalizada; si no existe, DEBE mostrar un fallback con dorsal y «Jugador desconocido» sin romper el render.
- **FR-075 (Evento)** CUANDO un proceso autorizado invalide el tag `squad`, el sistema DEBE refrescar la plantilla en la siguiente petición.

### 7.9 Marca — Escudo oficial

- **FR-076 (Ubicuo)** El sistema DEBE renderizar el escudo oficial de River Plate provisto por el club, en formato SVG o PNG de alta densidad, con dimensiones explícitas y texto alternativo descriptivo.
- **FR-077 (No deseado)** SI el escudo no puede cargarse, ENTONCES el sistema DEBE mostrar la variante monocromática de respaldo manteniendo el espacio reservado y sin alterar el layout.
- **FR-078 (Ubicuo)** El sistema NO DEBE deformar, recolorear, recortar ni superponer elementos sobre el escudo oficial; DEBE respetar su relación de aspecto y un área de resguardo mínima.

---

## 8. Reglas de negocio y funciones puras

> Todas las reglas de esta sección se implementan en `src/domain/**` como funciones puras, deterministas y sin efectos secundarios. Reciben `now` y `timeZone` como parámetros; nunca leen el reloj ni el entorno.

### 8.1 R-TZ — Zona horaria y fecha local

**Regla:** un instante se convierte a fecha local exclusivamente con `Intl.DateTimeFormat(locale, { timeZone })` y `formatToParts`.

```ts
type DateKey = `${number}-${number}-${number}`; // AAAA-MM-DD
toLocalDateKey(instant: string | Date, timeZone: string): DateKey
```

| Caso | Instante (UTC) | Zona | Fecha local esperada |
|------|----------------|------|----------------------|
| Kickoff nocturno | `2026-03-15T01:30:00Z` | `America/Argentina/Buenos_Aires` | `2026-03-14` (22:30) |
| Mismo instante, otra zona | `2026-03-15T01:30:00Z` | `Europe/Madrid` | `2026-03-15` (02:30) |
| Cambio de horario | `2026-11-01T04:30:00Z` | `America/New_York` | `2026-11-01` (00:30, EDT→EST) |
| Cruce de año | `2027-01-01T02:00:00Z` | `America/Argentina/Buenos_Aires` | `2026-12-31` (23:00) |

**Prohibiciones:** `toISOString().slice(0, 10)`, `date.getDate()`, `date.getMonth()`, `date.getDay()`, `toLocaleDateString()` sin `timeZone`.

**Guardia automática:** test de arquitectura que escanea `src/` y falla si detecta los patrones prohibidos fuera de `src/domain/time/*`.

### 8.2 R-STATUS — Estado del partido

**Prioridad:** el estado explícito de la fuente manda; solo se deriva cuando no existe.

```ts
type MatchStatus = 'scheduled' | 'live' | 'halftime' | 'finished'
                 | 'postponed' | 'suspended' | 'cancelled';

deriveMatchStatus(match: Match, now: Date, config?: { liveWindowMinutes?: number }): MatchStatus
```

| Condición | Resultado |
|-----------|-----------|
| `match.statusOverride ∈ {postponed, suspended, cancelled}` | Ese estado |
| `match.score != null && match.finishedAt != null` | `finished` |
| `now < kickoffAt` | `scheduled` |
| `now < kickoffAt + liveWindow` (default 120 min; copas con alargue 150) | `live` (o `halftime` si `period = 'HT'`) |
| Resto | `finished` (derivado) |

**Regla:** un partido nunca puede mostrarse «En Vivo» antes del kickoff ni después de la ventana configurada.

### 8.3 R-TIME — Minuto de juego

```ts
computeMatchMinute(match: Match, now: Date): number | null
```

- Devuelve `null` si no está en vivo.
- Considera entretiempo (45–60): devuelve `45+`.
- Considera descuento configurado (`stoppageFirstHalf`, `stoppageSecondHalf`).
- Nunca devuelve un minuto mayor que `90 + descuento` salvo alargue configurado.

### 8.4 R-RANK — Rankings de goleadores y asistentes

```ts
computeScorers(players: Player[], events: MatchEvent[], filter?: SeasonFilter): RankingEntry[]
computeAssists(events: MatchEvent[], filter?: SeasonFilter): RankingEntry[]
```

**Goles:** cuentan goles y penales; **no** cuentan autogoles (se acreditan al equipo rival, no al jugador).
**Asistencias:** solo el pase previo directo registrado; no se infieren.

**Desempate goleadores:** goles ↓ → asistencias ↓ → minutos ↑ → apellido (`localeCompare('es-AR')`) ↑.
**Desempate asistentes:** asistencias ↓ → goles ↓ → minutos ↑ → apellido ↑.
**Salida:** solo jugadores con al menos 1 evento del tipo correspondiente; `isTied = true` cuando comparten la primera posición con el mismo valor principal.

### 8.5 R-RATING — Calificaciones y MVP

```ts
type Rating = number | null; // 1.0 – 10.0, un decimal
selectMvp(players: PlayerMatchStats[]): PlayerMatchStats | null
averageTeamRating(players: PlayerMatchStats[]): number | null
```

- Nota válida: `1.0 ≤ rating ≤ 10.0`, redondeada a 1 decimal.
- `null` = «SC»; se excluye de promedios y del MVP.
- **MVP:** mayor nota → mayor cantidad de minutos → mayor (goles + asistencias) → apellido ↑.
- **Promedio del equipo:** media aritmética de notas no nulas, 1 decimal; `null` si no hay notas.

### 8.6 R-RECORD — Registro de temporada

```ts
computeSeasonRecord(matches: Match[]): SeasonRecord
computeForm(matches: Match[], limit?: number): FormResult[] // default 5
computeSplit(matches: Match[]): { home: SeasonRecord; away: SeasonRecord }
```

- Solo se consideran partidos con estado `finished`.
- `PTS = 3 × PG + 1 × PE` únicamente en competiciones de liga; en copas se informa efectividad como `PG / PJ` y no se muestran puntos de tabla.
- **Efectividad** (ligas): `PTS / (3 × PJ)` expresada en porcentaje, redondeada a 1 decimal.
- **Racha:** cantidad de victorias o derrotas consecutivas más reciente; si el último fue empate, «sin racha».
- **Forma:** últimos `limit` partidos finalizados, del más reciente al más antiguo.

### 8.7 R-ORDER — Orden y filtros

```ts
sortMatches(matches, 'asc' | 'desc'): Match[]
filterMatches(matches, { competitionId?, monthKey?, status?, now, timeZone }): Match[]
groupMatchesByLocalDate(matches, timeZone): Array<{ dateKey: DateKey; matches: Match[] }>
```

- Próximos partidos: ascendente por kickoff. Resultados: descendente.
- `monthKey` usa `AAAA-MM` en la zona del usuario.
- Los filtros son combinables (AND) y no mutan la entrada.
- Desempate estable por `id`.

### 8.8 R-NEWS — Novedades

```ts
computeReadingTime(body: string): number
filterNews(articles: NewsArticle[], { category?, query? }): NewsArticle[]
sortNews(articles: NewsArticle[]): NewsArticle[] // publishedAt ↓, id ↑
paginate<T>(items: T[], page: number, pageSize: number): { items: T[]; hasMore: boolean }
```

- Búsqueda sin distinguir mayúsculas ni acentos (normalización `NFD` + eliminación de diacríticos).
- Página por defecto: 9 artículos; sin duplicados al acumular páginas.
- Tiempo de lectura: `max(1, ceil(palabras/200))`; se excluyen bloques de imagen y video.

### 8.9 R-SQUAD — Normalización de la plantilla

```ts
normalizeSquadPayload(raw: RawSquadPayload, provider: string): NormalizedSquad
mapProviderPlayer(raw: RawPlayer, provider: string): Player | null
validateSquad(squad: NormalizedSquad): SquadValidationResult
resolveSquadPlayer(squad: NormalizedSquad, playerId: string): Player | null
```

**Reglas:**

1. **ID canónico:** `${provider}:${raw.id}`; estable ante cambios de nombre o dorsal.
2. **Campos obligatorios:** `id` del proveedor, nombre y posición. Si falta alguno, el jugador se omite y se agrega un error de validación.
3. **Posiciones:** mapeo explícito `GK|POR → GK`, `DF|DEF → DF`, `MF|MED → MF`, `FW|DEL → FW`; valores desconocidos → `null` y jugador omitido con advertencia.
4. **Dorsal:** entero 1–99; si hay duplicados, se conserva el primero por `updatedAt` y se emite advertencia (no se rompe la plantilla).
5. **Orden:** posición (`GK→DF→MF→FW`) → dorsal ascendente → apellido (`es-AR`).
6. **Idempotencia:** normalizar dos veces el mismo payload produce exactamente el mismo resultado.
7. **Payload vacío o inválido:** no se acepta; se conserva el snapshot previo.
8. **Fallback:** `resolveSquadPlayer` devuelve `null` y la UI muestra «Jugador desconocido» con el dorsal disponible.

### 8.10 Catálogo de funciones puras

| Módulo | Función | Entrada | Salida |
|--------|---------|---------|--------|
| `domain/time` | `toLocalDateKey` | instante, tz | `AAAA-MM-DD` |
| `domain/time` | `formatLocalDateTime` | instante, tz, estilo | `string` |
| `domain/time` | `formatLocalDayHeader` | clave, tz, now | `Hoy` / `Mañana` / fecha larga |
| `domain/time` | `getMonthKey` | instante, tz | `AAAA-MM` |
| `domain/matches` | `deriveMatchStatus` | partido, now, config | `MatchStatus` |
| `domain/matches` | `computeMatchMinute` | partido, now | `number \| null` |
| `domain/matches` | `filterMatches` | partidos, filtros | `Match[]` |
| `domain/matches` | `sortMatches` | partidos, orden | `Match[]` |
| `domain/matches` | `groupMatchesByLocalDate` | partidos, tz | grupos por día |
| `domain/matches` | `getNextMatch` | partidos, now | `Match \| null` |
| `domain/matches` | `getLastResult` | partidos, now | `Match \| null` |
| `domain/matches` | `computeHeadToHead` | partidos, equipos | `H2HSummary` |
| `domain/stats` | `computeScorers` | jugadores, eventos | ranking |
| `domain/stats` | `computeAssists` | eventos | ranking |
| `domain/stats` | `computeSeasonRecord` | partidos | `SeasonRecord` |
| `domain/stats` | `computeForm` | partidos, límite | `FormResult[]` |
| `domain/stats` | `computeSplit` | partidos | local/visitante |
| `domain/stats` | `selectMvp` | stats de jugadores | jugador |
| `domain/stats` | `averageTeamRating` | stats de jugadores | `number \| null` |
| `domain/news` | `computeReadingTime` | cuerpo | minutos |
| `domain/news` | `filterNews` | artículos, filtros | `NewsArticle[]` |
| `domain/news` | `sortNews` | artículos | `NewsArticle[]` |
| `domain/news` | `paginate` | lista, página, tamaño | página + `hasMore` |
| `domain/squad` | `normalizeSquadPayload` | payload crudo, proveedor | plantilla normalizada |
| `domain/squad` | `mapProviderPlayer` | jugador crudo, proveedor | `Player \| null` |
| `domain/squad` | `validateSquad` | plantilla normalizada | resultado de validación |
| `domain/squad` | `resolveSquadPlayer` | plantilla, id | `Player \| null` |

### 8.11 Matriz mínima de casos borde (obligatoria en tests)

| # | Caso | Requisito |
|---|------|-----------|
| 1 | Kickoff que cruza medianoche UTC → día local anterior | FR-008, SC-002 |
| 2 | Usuario en `Asia/Tokyo` con partido de tarde argentina | FR-002, FR-004 |
| 3 | Cambio de horario DST (Nueva York y Madrid) | FR-002 |
| 4 | Partido exactamente en el instante del kickoff | R-STATUS |
| 5 | Partido en el límite de la ventana live (120 min) | R-STATUS |
| 6 | Partido con alargue (150 min) | R-STATUS |
| 7 | Empate en goles y asistencias → desempate por minutos | R-RANK |
| 8 | Autogol (no suma al goleador) | R-RANK |
| 9 | Jugador sin calificación → promedio y MVP lo excluyen | R-RATING |
| 10 | Temporada sin partidos finalizados | R-RECORD |
| 11 | Feed vacío por filtro inexistente | FR-019 |
| 12 | Artículo con cuerpo vacío → lectura 1 min | R-NEWS |
| 13 | Página de resultados sin duplicados | FR-016 |
| 14 | Payload del proveedor con jugador sin posición → omitido, resto válido | R-SQUAD |
| 15 | Dorsal duplicado → se conserva el primero por `updatedAt` + advertencia | R-SQUAD |
| 16 | Payload vacío → se conserva el snapshot previo | R-SQUAD, FR-070 |
| 17 | Jugador de formación ausente en plantilla → fallback «Jugador desconocido» | FR-074 |
| 18 | Escudo no disponible → variante monocromática sin CLS | FR-077, SC-010 |

---

## 9. Modelo conceptual de datos

> Modelo de dominio (no de base de datos). En v1 se materializa en fixtures JSON tipados con Zod + plantilla normalizada desde proveedor.

```ts
type Competition = {
  id: string; slug: string; name: string;
  type: 'league' | 'cup' | 'international' | 'friendly';
  seasonLabel: string;
};

type Season = {
  id: string; label: string; startDate: string; endDate: string;
  isActive: boolean; competitionIds: string[];
};

type Team = { id: string; name: string; shortName: string; crest: string };

type ProviderRef = {
  provider: string;        // p. ej. "api-football"
  externalId: string;      // ID en el proveedor
  updatedAt: string;       // ISO-8601
};

type Player = {
  id: string;              // canónico: `${provider}:${externalId}`
  name: string; displayName: string; shirtNumber: number;
  position: 'GK' | 'DF' | 'MF' | 'FW'; nationality: string;
  photo?: string; isCaptain?: boolean;
  providerRef?: ProviderRef;
  contractUntil?: string;  // AAAA-MM-DD (dato informativo)
};

type SquadMembership = {
  playerId: string; teamId: string; seasonId: string;
  shirtNumber: number; position: 'GK' | 'DF' | 'MF' | 'FW';
  role: 'starter' | 'rotation' | 'youth';
  from: string; to?: string;
};

type SquadSnapshot = {
  provider: string; fetchedAt: string; checksum: string;
  players: Player[]; memberships: SquadMembership[];
  warnings: SquadWarning[];
};

type RawSquadPayload = {
  provider: string; fetchedAt: string;
  players: RawPlayer[];   // forma específica del proveedor
};

type SquadWarning = {
  code: 'MISSING_FIELD' | 'DUPLICATE_NUMBER' | 'UNKNOWN_POSITION' | 'EMPTY_PAYLOAD';
  externalId?: string; message: string;
};

type Match = {
  id: string; seasonId: string; competitionId: string; round: string;
  kickoffAt: string;              // ISO-8601 UTC
  venue: string; referee?: string; broadcasters?: string[];
  homeTeamId: string; awayTeamId: string;
  statusOverride?: 'postponed' | 'suspended' | 'cancelled' | 'finished';
  statusReason?: string;
  period?: '1H' | 'HT' | '2H' | 'ET' | 'PEN';
  score?: { home: number; away: number; halftime?: { home: number; away: number } };
  finishedAt?: string;
  liveWindowMinutes?: number;     // default 120
  attendance?: number;
  stats?: TeamMatchStats;
  lineups?: Lineup[];
  events: MatchEvent[];
};

type MatchEvent = {
  id: string; matchId: string; minute: number; extraMinute?: number;
  type: 'goal' | 'own_goal' | 'penalty_goal' | 'penalty_missed'
      | 'yellow' | 'red' | 'second_yellow' | 'substitution' | 'var';
  teamId: string; playerId: string; relatedPlayerId?: string; // asistencia o jugador que sale
  detail?: string;
};

type PlayerMatchStats = {
  matchId: string; playerId: string; minutes: number;
  rating: number | null; goals: number; assists: number;
  shots: number; shotsOnTarget: number;
  cards: { yellow: number; red: number };
};

type Lineup = {
  matchId: string; teamId: string; formation: string; coach: string;
  starters: Array<{ playerId: string; position: string; shirtNumber: number }>;
  bench: string[];
};

type NewsArticle = {
  id: string; slug: string; title: string; excerpt: string;
  body: Array<{ type: 'paragraph' | 'heading' | 'image' | 'quote'; text?: string; src?: string }>;
  category: 'plantel-profesional' | 'inferiores' | 'institucional' | 'mercado-de-pases';
  tags: string[]; author: string;
  publishedAt: string; updatedAt?: string;
  coverImage: string; featured?: boolean; relatedIds?: string[];
};

type SeasonRecord = {
  played: number; won: number; drawn: number; lost: number;
  goalsFor: number; goalsAgainst: number; goalDiff: number;
  points?: number; effectiveness: number; // %
};

type RankingEntry = {
  playerId: string; player: Player; value: number;
  goals: number; assists: number; minutes: number; isTied: boolean;
};
```

---

## 10. Requisitos no funcionales

### 10.1 Performance

- **NFR-001** LCP p75 ≤ 2,0 s en móvil 4G para `/` y `/partidos/{id}`.
- **NFR-002** INP p75 ≤ 200 ms y CLS ≤ 0,05.
- **NFR-003** JS inicial ≤ 180 KB gzip en rutas de contenido; componentes interactivos cargados bajo demanda.
- **NFR-004** Imágenes en AVIF/WebP con `next/image`, dimensiones explícitas y `priority` solo en el hero.
- **NFR-005** Fuentes con `font-display: swap` y precarga de la variable principal.
- **NFR-006** El filtrado de novedades y calendario DEBE ejecutarse en cliente sobre datos ya cargados (< 100 ms).
- **NFR-007** El escudo oficial DEBE servirse optimizado (SVG o PNG @2x), con dimensiones reservadas para evitar CLS.

### 10.2 Accesibilidad

- **NFR-008** Cumplimiento WCAG 2.2 AA: contraste ≥ 4,5:1 en texto, foco visible, navegación completa por teclado.
- **NFR-009** Áreas táctiles ≥ 44 × 44 px.
- **NFR-010** Pestañas, filtros y acordeones con roles ARIA correctos y manejo de flechas.
- **NFR-011** Respeto de `prefers-reduced-motion`; sin animaciones que impidan la lectura.
- **NFR-012** Textos alternativos descriptivos en escudos, fotos y gráficos; los datos nunca dependen solo del color.

### 10.3 SEO y contenido

- **NFR-013** Metadatos únicos por ruta (title, description, canonical, Open Graph, Twitter Card).
- **NFR-014** JSON-LD: `NewsArticle` en notas, `SportsEvent` en partidos, `BreadcrumbList` en navegación profunda.
- **NFR-015** `sitemap.xml` y `robots.txt` generados; URLs legibles y estables.

### 10.4 Seguridad y secretos

- **NFR-016** Ninguna credencial o endpoint privado expuesto al cliente; las integraciones pasan por el servidor.
- **NFR-017** La API key del proveedor de plantel DEBE vivir solo en variables server-side (`SQUAD_PROVIDER_KEY`), nunca con prefijo `NEXT_PUBLIC_`.
- **NFR-018** Sanitización del HTML enriquecido de artículos y `Content-Security-Policy` en producción.

### 10.5 Calidad y testabilidad

- **NFR-019** TypeScript `strict`, sin `any` implícito; `pnpm typecheck` obligatorio en CI.
- **NFR-020** Cobertura de ramas ≥ 95 % en `src/domain/**`; cada función pura con tests de caso feliz y borde.
- **NFR-021** Tests E2E de los 4 flujos críticos con reloj fijo (`page.clock.setFixedTime`).
- **NFR-022** `src/domain` sin dependencias de React, Next.js, red o almacenamiento (verificado por test de arquitectura).
- **NFR-023** Los tests del proveedor usan fixtures grabados; el CI NO DEBE llamar al proveedor real.

### 10.6 Compatibilidad e idioma

- **NFR-024** Soporte de iOS Safari 16+, Chrome/Edge últimas 2 versiones, Firefox ESR y Chrome Android.
- **NFR-025** Ancho mínimo soportado 360 px; diseño fluido hasta 1440 px.
- **NFR-026** Idioma `es-AR`; fechas y números formateados con `Intl`; textos de dominio sin hardcodear en la lógica.

### 10.7 Resiliencia del proveedor y observabilidad

- **NFR-027** Timeout de 5 s por llamada al proveedor, máximo 3 reintentos con backoff exponencial y circuit breaker tras 5 fallos consecutivos.
- **NFR-028** Toda respuesta del proveedor DEBE validarse con Zod antes de ingresar al dominio; los errores se registran con código y `externalId` (sin datos personales).
- **NFR-029** Degradación obligatoria: si el proveedor falla, la experiencia sigue operativa con el snapshot y un aviso no bloqueante.

---

## 11. Criterios de aceptación y Definition of Done

Un incremento se considera **terminado** cuando:

1. Todos los FR de la historia están implementados y trazados a tests.
2. `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build` pasan sin errores ni warnings nuevos.
3. Los tests de dominio cubren casos borde de §8.11 y la cobertura cumple NFR-020.
4. E2E en verde en desktop y viewport 390 × 844.
5. axe sin violaciones *critical/serious*; navegación completa por teclado verificada.
6. Lighthouse ≥ 95 en las 4 rutas clave.
7. Estados de carga, vacío y error implementados y revisados.
8. Sin errores en consola ni warnings de hidratación.
9. Plantilla: normalización idempotente, fallback a snapshot probado y 100 % de jugadores de formaciones resueltos.
10. Escudo oficial: sin deformación, con `alt`, variantes de tamaño y fallback monocromático verificado.
11. Documentación de la feature actualizada (spec/plan/tasks).

---

## 12. Fuera de alcance

| Excluido | Motivo | Posible iteración |
|----------|--------|-------------------|
| Autenticación, cuentas y favoritos | No aporta al núcleo informativo | v2 |
| Comentarios y comunidad | Requiere moderación y backend | v2 |
| Votación de jugador del partido por usuarios | Requiere backend y anti-abuso | v2 |
| Predicciones y fantasy | Producto distinto | v3 |
| App nativa (iOS/Android) | Web responsive cubre v1 | v3 |
| Multilenguaje | Público local | v2 |
| Panel de administración / CMS | Datos mock en v1 | v2 |
| Página pública de plantel (`/plantel`) | La plantilla se usa como dato de soporte en v1 | v2 |
| Integración de partidos con API real | Solo el plantel se integra en v1 | v1.1 |
| Historial de temporadas anteriores | Solo temporada activa | v2 |
| Push notifications / recordatorios | Requiere backend | v2 |
| Modo offline / PWA instalable | Optimización posterior | v2 |
| Fútbol femenino y divisiones juveniles como entidades propias | Alcance editorial separado | v2 |
| Ingesta de calificaciones individuales desde el proveedor | En v1 son editoriales; contrato preparado para v2 | v2 |

---

## 13. Supuestos y decisiones

| ID | Supuesto / decisión | Estado |
|----|---------------------|--------|
| A-01 | Partidos, competencias y noticias con **datos mock tipados** (Zod) detrás de interfaces de repositorio | Validado con el usuario |
| A-02 | Stack **Next.js 15 App Router + TypeScript + Tailwind v4**, Vitest + Playwright | Validado con el usuario |
| A-03 | Alcance **MVP completo** (Novedades + Calendario + Match Center + Temporada) | Validado con el usuario |
| A-04 | Público hispanohablante; idioma único `es-AR` | Supuesto |
| A-05 | Temporada activa = año calendario 2026, configurable por dato | Supuesto |
| A-06 | Las calificaciones individuales son de origen editorial en v1 (el contrato admite ingestarlas del proveedor en v2) | Validado con el usuario |
| A-07 | Se usa el **escudo oficial** provisto por el club, sin alteraciones, con fallback monocromático | Validado con el usuario |
| A-08 | Deploy en Vercel (o entorno Node compatible); sin base de datos en v1 | Supuesto |
| A-09 | La zona horaria del usuario se detecta en cliente; SSR usa `America/Argentina/Buenos_Aires` como fallback | Decisión técnica |
| A-10 | «En vivo» se deriva por ventana temporal configurable (120 min; 150 en copas con alargue) | Decisión técnica |
| A-11 | La **plantilla se carga desde un proveedor externo** mediante adaptador server-side; el proveedor concreto queda parametrizado por env y contrato normalizado | Validado con el usuario |
| A-12 | Persistencia de plantilla: caché de Next.js con tag `squad` + snapshot JSON versionado como respaldo; sin base de datos en v1 | Decisión técnica |
| A-13 | Las fotos de jugadores provienen del proveedor y quedan sujetas a sus términos de uso; si faltan, se usa un placeholder propio | Supuesto |

---

## 14. Riesgos

| ID | Riesgo | Prob. | Impacto | Mitigación |
|----|--------|-------|---------|------------|
| R-01 | Desajuste de hidratación por fechas dependientes de zona horaria | Alta | Medio | Componente `LocalDate` client-only + cookie de TZ + `suppressHydrationWarning` acotado + test E2E con 2 zonas |
| R-02 | Fixtures mock que no representan la API real | Media | Alto | Contratos Zod + interfaces de repositorio + tests de contrato; el adaptador real solo cambia infraestructura |
| R-03 | Complejidad del Match Center (5 pestañas × 3 estados) | Alta | Alto | Entregar por fases, tabs con carga diferida, datos normalizados y tests por estado |
| R-04 | Uso del escudo oficial sin autorización o con alteraciones | Media | Alto | Autorización institucional por escrito, asset provisto por el club, reglas de uso en §7.9 y revisión de marca antes del release |
| R-05 | Subjetividad de las calificaciones | Media | Bajo | Escala y criterios documentados; fuente declarada en la ficha |
| R-06 | Deuda por saltarse el dominio puro | Media | Alto | Regla de dependencias + test de arquitectura desde el día 1 |
| R-07 | Rate limits o caída del proveedor de plantel | Media | Alto | Caché 6 h, single-flight, backoff, snapshot y aviso no bloqueante |
| R-08 | Cambios de esquema del proveedor rompen la normalización | Media | Medio | Zod estricto + tests de contrato con payloads grabados + alertas de validación |
| R-09 | Fotos de jugadores con derechos no cubiertos | Media | Medio | Usar URLs del proveedor según sus términos o placeholders propios; registrar atribución |

---

## 15. Trazabilidad

| Historia | Requisitos | Tests previstos |
|----------|------------|-----------------|
| US-01 Novedades | FR-010 … FR-019 | `news.filters`, `news.reading-time`, `news.pagination`, E2E filtro + detalle |
| US-02 Calendario | FR-020 … FR-029 | `matches.filters`, `matches.status`, `time.grouping`, E2E grilla/agenda |
| US-03 Pre/Live | FR-030 … FR-041 | `matches.status`, `matches.minute`, E2E countdown/live con clock fijo |
| US-04 Post-partido | FR-042 … FR-050 | `stats.ratings`, `stats.mvp`, E2E pestañas y calificaciones |
| US-05 Temporada | FR-051 … FR-060 | `stats.scorers`, `stats.assists`, `stats.record`, consistencia con fixtures |
| US-06 Transversal | FR-001 … FR-009, FR-061 … FR-065, NFR-001 … NFR-029 | `time.timezone` (4 zonas), `architecture.no-utc`, axe, Lighthouse |
| US-07 Plantel | FR-066 … FR-075 | `squad.normalize`, `squad.validation`, `squad.fallback`, test de arquitectura de secretos |
| Marca | FR-076 … FR-078, NFR-007 | Test de componente `ClubCrest` + axe + verificación de CLS |

---

## 16. Preguntas abiertas

Las decisiones de escudo oficial y origen de la plantilla quedaron **resueltas**. Restan definiciones no bloqueantes que se cierran antes de la fase indicada:

1. **Proveedor concreto de plantel** (API-Football, Sportmonks, Football-Data.org u otro): no bloquea el diseño, que se implementa contra un contrato normalizado; se define antes de F2B. *(Sin bloqueo)*
2. **Autorización de uso del escudo oficial:** obtener el permiso institucional/archivo provisto por el club antes del release. *(Bloqueante solo para publicar)*
3. **Alcance de «histórico»:** se asume solo temporada activa; comparativa con temporadas anteriores queda para v2. *(Sin bloqueo)*
4. **Equipo femenino:** se evalúa como competición/plantel en v2. *(Sin bloqueo)*

---

**Fin de la especificación v0.2.0 — pendiente de aprobación para implementar `plan.md` v0.2.0.**
