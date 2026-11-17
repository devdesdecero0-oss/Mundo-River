# Constitución — Mundo River

Principios innegociables. Toda spec, plan y tarea debe cumplirlos.

1. **Stack controlado**: Next.js (App Router), TypeScript estricto y Tailwind CSS con `pnpm`. No se agregan librerías externas sin aprobación previa.
2. **La spec manda**: Nada se implementa si no está definido en la spec activa (`specs/NNN-*/spec.md`). Ante cualquier duda, se frena y se pregunta.
3. **Lógica separada de interfaz**: Cálculos de estadísticas, promedios de calificaciones, filtros y fechas viven en funciones puras dentro de `src/lib/` o `src/utils/`, nunca en componentes React.
4. **Tests como puerta**: Toda lógica pura se valida con `pnpm test` (Vitest) y la calidad con `pnpm lint`. Prohibido avanzar de tarea con tests en rojo.
5. **Fechas locales e integridad de datos**: Las fechas y horarios de partidos se procesan estrictamente en hora local (`AAAA-MM-DD`), nunca en UTC puro, respetando los 3 estados válidos (`Próximo`, `En Vivo`, `Finalizado`).
6. **Identidad e idioma**: Código en español; interfaz, textos y documentación, respetando la paleta institucional de River Plate (`#FFFFFF`, `#E30613`, `#0A0A0A`) con diseño *mobile-first*.