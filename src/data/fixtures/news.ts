import type { NewsArticle } from "@/domain/types";

const NOW = Date.now();
const HOUR = 3_600_000;

function ago(hours: number): string {
  return new Date(NOW - hours * HOUR).toISOString();
}

const covers = {
  plantel: "/images/news/plantel.svg",
  inferiores: "/images/news/inferiores.svg",
  institucional: "/images/news/institucional.svg",
  mercado: "/images/news/mercado.svg",
} as const;

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: "n-001",
    slug: "river-practica-ezeiza-previa-estudiantes",
    title: "River cerró la semana con fútbol en Ezeiza y define el equipo para recibir a Estudiantes",
    excerpt:
      "El plantel completó una nueva práctica de fútbol en el River Camp. Gallardo evaluará la evolución de dos futbolistas que arrastran molestias.",
    body: [
      { type: "paragraph", text: "El plantel de River Plate completó esta mañana una nueva jornada de entrenamiento en el River Camp de Ezeiza. El cuerpo técnico hizo hincapié en la salida clara desde el fondo y en la presión tras pérdida." },
      { type: "heading", text: "Práctica de fútbol y variantes" },
      { type: "paragraph", text: "Durante la práctica de fútbol, Marcelo Gallardo probó una variante en la mitad de la cancha con la entrada de Rodrigo Aliendro por Santiago Simón. La decisión se resolverá después del entrenamiento de mañana." },
      { type: "quote", text: "“Tenemos un grupo que compite y que entiende lo que significa defender esta camiseta. El domingo necesitamos el Monumental lleno”.", caption: "Voz desde el cuerpo técnico" },
      { type: "paragraph", text: "La delegación quedará concentrada el sábado por la noche. El partido ante Estudiantes se jugará en el Más Monumental y será clave para la pelea por el primer puesto de la zona." },
    ],
    category: "plantel-profesional",
    tags: ["Ezeiza", "Estudiantes", "Gallardo", "Liga"],
    author: "Redacción Mundo River",
    publishedAt: ago(3),
    coverImage: covers.plantel,
    featured: true,
    relatedIds: ["n-010", "n-002", "n-012"],
  },
  {
    id: "n-002",
    slug: "driussi-goleador-temporada-libertadores",
    title: "Driussi sostiene la ilusión: el goleador de la temporada y su mejor versión en River",
    excerpt:
      "Con cinco tantos en el semestre, el delantero lidera la tabla de goleadores del equipo y se ilusiona con la final de la Libertadores.",
    body: [
      { type: "paragraph", text: "Sebastián Driussi atraviesa un momento de plenitud. Sus goles no solo explican la campaña: también ordenan el ataque de River en los momentos de mayor exigencia." },
      { type: "heading", text: "Un socio para Mastantuono" },
      { type: "paragraph", text: "La sociedad con Franco Mastantuono y Facundo Colidio le dio al equipo una vía de gol constante. Driussi combina movimientos de nueve con apariciones por la banda derecha, lo que dificulta la marca." },
      { type: "paragraph", text: "El próximo desafío será la final de la Copa Libertadores. El delantero llega en su mejor momento y es uno de los nombres fijos en la consideración del cuerpo técnico." },
      { type: "image", src: covers.plantel, alt: "Portada de la nota sobre Driussi" },
    ],
    category: "plantel-profesional",
    tags: ["Driussi", "goleador", "Libertadores"],
    author: "Martina Sosa",
    publishedAt: ago(7),
    coverImage: covers.plantel,
    featured: true,
    relatedIds: ["n-004", "n-001"],
  },
  {
    id: "n-003",
    slug: "reserva-goleo-boca-lider-zona",
    title: "La Reserva goleó a Boca y se afirma en la cima de su zona",
    excerpt:
      "El equipo de la cantera sumó una victoria contundente en el clásico y estiró su invicto como local. Tres jugadores dieron el salto a la primera división en el último año.",
    body: [
      { type: "paragraph", text: "La Reserva de River Plate venció con autoridad a Boca en el River Camp y se afirma en la cima de su zona. El equipo dirigido por la dupla técnica mostró un juego asociado que ilusiona." },
      { type: "heading", text: "El camino de la cantera" },
      { type: "paragraph", text: "El proyecto de inferiores continúa dando frutos: tres jugadores fueron promovidos al plantel profesional en los últimos doce meses y otros dos entrenan de manera permanente con la primera." },
      { type: "quote", text: "“En River no se negocia la formación: se compite y se juega bien en todas las categorías”.", caption: "Coordinación de inferiores" },
      { type: "paragraph", text: "El próximo compromiso será frente a Vélez, con el objetivo de sostener el liderazgo y seguir acechando el récord de puntos de la categoría." },
    ],
    category: "inferiores",
    tags: ["Reserva", "cantera", "clásico", "Boca"],
    author: "Departamento de Inferiores",
    publishedAt: ago(26),
    coverImage: covers.inferiores,
    relatedIds: ["n-004", "n-009"],
  },
  {
    id: "n-004",
    slug: "mastantuono-podio-asistencias",
    title: "Mastantuono, de la cantera al podio de asistencias de la temporada",
    excerpt:
      "El enganche suma tres asistencias y dos goles en el campeonato. Su irrupción cambió el mapa creativo del equipo.",
    body: [
      { type: "paragraph", text: "Franco Mastantuono se consolidó como uno de los jugadores más determinantes de River. A su capacidad para romper líneas se le suma una lectura cada vez más precisa del último pase." },
      { type: "paragraph", text: "En la tabla de asistentes de la temporada comparte la cima con Ignacio Fernández, un símbolo del plantel que lo acompaña en la conducción del ataque." },
      { type: "heading", text: "Un salto sostenido" },
      { type: "paragraph", text: "El cuerpo técnico le dio minutos en partidos de alta exigencia y la respuesta fue inmediata. Su gol ante Flamengo y su asistencia en el superclásico quedaron entre las jugadas más destacadas del año." },
    ],
    category: "inferiores",
    tags: ["Mastantuono", "asistencias", "cantera"],
    author: "Martina Sosa",
    publishedAt: ago(29),
    coverImage: covers.inferiores,
    relatedIds: ["n-002", "n-003"],
  },
  {
    id: "n-005",
    slug: "monumental-nuevo-sector-final-libertadores",
    title: "El Monumental prepara un nuevo sector para la final de la Libertadores",
    excerpt:
      "El club avanza con las obras de accesibilidad y la ampliación de la platea baja. La capacidad total superará los 85 mil espectadores.",
    body: [
      { type: "paragraph", text: "River Plate avanza con las obras de remodelación del Más Monumental de cara a la final de la Copa Libertadores. El nuevo sector de platea baja sumará ubicaciones y mejorará los accesos." },
      { type: "heading", text: "Accesibilidad y experiencia" },
      { type: "paragraph", text: "La obra incluye nuevos ingresos para personas con movilidad reducida, rampas y un sistema de señalética renovado. Además se instalaron pantallas en los sectores de circulación." },
      { type: "paragraph", text: "El club informó que la capacidad total superará los 85 mil espectadores y que la venta de entradas para la final se comunicará en los próximos días." },
    ],
    category: "institucional",
    tags: ["Monumental", "obra", "Libertadores", "estadio"],
    author: "Redacción Mundo River",
    publishedAt: ago(48),
    coverImage: covers.institucional,
    featured: true,
    relatedIds: ["n-006", "n-011"],
  },
  {
    id: "n-006",
    slug: "river-presento-plan-obras-ezeiza",
    title: "River presentó el plan de obras del predio de Ezeiza para 2027",
    excerpt:
      "El proyecto contempla nuevos campos de juego, un centro de alto rendimiento y un área médica de última generación.",
    body: [
      { type: "paragraph", text: "El club presentó el plan de obras del River Camp para el próximo año. El proyecto incluye tres nuevos campos de juego y un centro de alto rendimiento para el plantel profesional y las inferiores." },
      { type: "paragraph", text: "La primera etapa comenzará en enero y contempla la remodelación del área médica y la incorporación de tecnología para el monitoreo de cargas." },
      { type: "quote", text: "“Invertir en infraestructura es invertir en competitividad”.", caption: "Área de infraestructura" },
    ],
    category: "institucional",
    tags: ["Ezeiza", "obra", "infraestructura"],
    author: "Redacción Mundo River",
    publishedAt: ago(72),
    coverImage: covers.institucional,
    relatedIds: ["n-005"],
  },
  {
    id: "n-007",
    slug: "mercado-pases-lateral-zurdo",
    title: "Mercado de pases: River sigue de cerca a un lateral zurdo de proyección",
    excerpt:
      "La secretaría técnica monitorea a un defensor de 23 años que se desempeña en el fútbol sudamericano. La operación no sería inmediata.",
    body: [
      { type: "paragraph", text: "La secretaría técnica de River sigue con atención a un lateral izquierdo de 23 años que se destaca en el fútbol sudamericano. El seguimiento se inició hace varios meses." },
      { type: "paragraph", text: "Según pudo saber Mundo River, la operación no sería inmediata: el club prioriza la renovación de contratos y la consolidación del plantel actual antes de avanzar por refuerzos." },
      { type: "heading", text: "Prioridades del mercado" },
      { type: "paragraph", text: "La dirigencia trabaja en paralelo con el cuerpo técnico para definir las necesidades de cara a la próxima temporada. La idea es sumar dos o tres jerarquías y dar lugar a los juveniles." },
    ],
    category: "mercado-de-pases",
    tags: ["mercado", "lateral", "refuerzos", "fichajes"],
    author: "Gonzalo Ferreyra",
    publishedAt: ago(96),
    coverImage: covers.mercado,
    relatedIds: ["n-008"],
  },
  {
    id: "n-008",
    slug: "renovacion-contrato-mastantuono",
    title: "Oficial: River renovó el contrato de Franco Mastantuono hasta 2028",
    excerpt:
      "El club anunció la extensión del vínculo del juvenil, con una cláusula de salida actualizada. El jugador expresó su deseo de seguir creciendo en River.",
    body: [
      { type: "paragraph", text: "River Plate oficializó la renovación de Franco Mastantuono hasta diciembre de 2028. El anuncio se realizó en las redes oficiales del club con un video desde el Monumental." },
      { type: "paragraph", text: "El nuevo contrato incluye una actualización de la cláusula de salida y mejores condiciones para el jugador, que se consolidó como titular en el último año." },
      { type: "quote", text: "“Estoy muy feliz de seguir en el club que me formó. Quiero ganar todo con esta camiseta”.", caption: "Franco Mastantuono" },
      { type: "paragraph", text: "La dirigencia destacó el trabajo de las divisiones inferiores y ratificó el compromiso de dar minutos a los juveniles en la primera división." },
    ],
    category: "mercado-de-pases",
    tags: ["renovación", "Mastantuono", "contrato", "juveniles"],
    author: "Gonzalo Ferreyra",
    publishedAt: ago(120),
    coverImage: covers.mercado,
    relatedIds: ["n-004", "n-007"],
  },
  {
    id: "n-009",
    slug: "pretemporada-inferiores-diciembre",
    title: "La pretemporada de las inferiores arranca en diciembre",
    excerpt:
      "Las categorías formativas tendrán una planificación especial con trabajos de fuerza, prevención de lesiones y torneos de verano.",
    body: [
      { type: "paragraph", text: "El área de inferiores de River confirmó el cronograma de pretemporada para sus categorías formativas. Los trabajos comenzarán en la primera semana de diciembre." },
      { type: "paragraph", text: "La planificación incluye un bloque de fuerza y prevención de lesiones, además de partidos amistosos frente a equipos de la región." },
      { type: "paragraph", text: "Los coordinadores destacaron la importancia de sostener la formación académica de los jugadores y el acompañamiento de las familias." },
    ],
    category: "inferiores",
    tags: ["pretemporada", "inferiores", "formación"],
    author: "Departamento de Inferiores",
    publishedAt: ago(144),
    coverImage: covers.inferiores,
    relatedIds: ["n-003"],
  },
  {
    id: "n-010",
    slug: "convocados-river-estudiantes",
    title: "Convocados en River para recibir a Estudiantes",
    excerpt:
      "El cuerpo técnico dio a conocer la lista de jugadores citados para el partido del domingo. Hay dos regresos y una baja por lesión.",
    body: [
      { type: "paragraph", text: "River dio a conocer la lista de convocados para el encuentro frente a Estudiantes. La nómina incluye 23 jugadores y presenta el regreso de dos futbolistas que se recuperaron de sus molestias." },
      { type: "paragraph", text: "La única baja confirmada es la de un mediocampista que sufrió una distensión en el entrenamiento del miércoles. El resto del plantel está a disposición." },
      { type: "paragraph", text: "El equipo saltaría a la cancha con la misma base que viene de ganar el superclásico, con una duda en la mitad de la cancha." },
    ],
    category: "plantel-profesional",
    tags: ["convocados", "Estudiantes", "lesiones"],
    author: "Redacción Mundo River",
    publishedAt: ago(8),
    coverImage: covers.plantel,
    relatedIds: ["n-001", "n-012"],
  },
  {
    id: "n-011",
    slug: "campana-solidaria-diez-toneladas",
    title: "La campaña solidaria del club recolectó diez toneladas de alimentos",
    excerpt:
      "La iniciativa de la fundación del club junto a los hinchas superó las expectativas y alcanzó a 42 comedores comunitarios.",
    body: [
      { type: "paragraph", text: "La campaña solidaria impulsada por la fundación del club recolectó diez toneladas de alimentos no perecederos. La colecta se realizó durante la última semana en el Monumental y en distintas sedes." },
      { type: "quote", text: "“La grandeza de River también se mide por lo que hace por su comunidad”.", caption: "Fundación River Plate" },
      { type: "paragraph", text: "Los alimentos serán distribuidos entre 42 comedores comunitarios de la Ciudad y la Provincia de Buenos Aires. El club agradeció la participación de los hinchas y voluntarios." },
    ],
    category: "institucional",
    tags: ["solidaridad", "fundación", "comunidad"],
    author: "Redacción Mundo River",
    publishedAt: ago(168),
    coverImage: covers.institucional,
    relatedIds: ["n-005", "n-006"],
  },
  {
    id: "n-012",
    slug: "como-juega-estudiantes",
    title: "El próximo rival: cómo juega Estudiantes y sus peligros ofensivos",
    excerpt:
      "El Pincha llega con una racha positiva como visitante. Analizamos su salida con tres atrás y la movilidad de sus delanteros.",
    body: [
      { type: "paragraph", text: "Estudiantes llega al Monumental con una idea clara: presionar alto y atacar por los costados. Su esquema con tres defensores le permite liberar a los carrileros y generar superioridad en ataque." },
      { type: "heading", text: "Claves del partido" },
      { type: "paragraph", text: "River deberá ganar la segunda pelota y evitar las transiciones rápidas. La movilidad de los delanteros del Pincha exige una coordinación precisa entre los centrales y el mediocampo." },
      { type: "paragraph", text: "El historial reciente favorece a River en el Monumental, aunque Estudiantes supo complicarlo en los últimos enfrentamientos." },
    ],
    category: "plantel-profesional",
    tags: ["Estudiantes", "análisis", "próximo rival"],
    author: "Martina Sosa",
    publishedAt: ago(12),
    coverImage: covers.plantel,
    relatedIds: ["n-001", "n-010"],
  },
];
