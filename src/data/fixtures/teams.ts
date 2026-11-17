import type { Competition, Season, Team } from "@/domain/types";

export const RIVER_TEAM_ID = "river";

export const RIVER: Team = {
  id: RIVER_TEAM_ID,
  name: "River Plate",
  shortName: "RIV",
  crest: "/brand/river-crest.svg",
  primaryColor: "#E4032E",
  secondaryColor: "#0B0B0F",
};

export const TEAMS: Team[] = [
  RIVER,
  {
    id: "boca",
    name: "Boca Juniors",
    shortName: "BOC",
    crest: "",
    primaryColor: "#103F79",
    secondaryColor: "#F2C200",
  },
  {
    id: "racing",
    name: "Racing Club",
    shortName: "RAC",
    crest: "",
    primaryColor: "#6BB7E8",
    secondaryColor: "#FFFFFF",
  },
  {
    id: "independiente",
    name: "Independiente",
    shortName: "IND",
    crest: "",
    primaryColor: "#D71920",
    secondaryColor: "#FFFFFF",
  },
  {
    id: "san-lorenzo",
    name: "San Lorenzo",
    shortName: "SLO",
    crest: "",
    primaryColor: "#1B3D8C",
    secondaryColor: "#D0021B",
  },
  {
    id: "velez",
    name: "Vélez Sarsfield",
    shortName: "VEL",
    crest: "",
    primaryColor: "#FFFFFF",
    secondaryColor: "#1F4E9C",
  },
  {
    id: "talleres",
    name: "Talleres",
    shortName: "TAL",
    crest: "",
    primaryColor: "#1B4E9B",
    secondaryColor: "#FFFFFF",
  },
  {
    id: "estudiantes",
    name: "Estudiantes",
    shortName: "EST",
    crest: "",
    primaryColor: "#D71920",
    secondaryColor: "#FFFFFF",
  },
  {
    id: "rosario-central",
    name: "Rosario Central",
    shortName: "CEN",
    crest: "",
    primaryColor: "#0B3C7A",
    secondaryColor: "#F5C400",
  },
  {
    id: "huracan",
    name: "Huracán",
    shortName: "HUR",
    crest: "",
    primaryColor: "#E30613",
    secondaryColor: "#FFFFFF",
  },
  {
    id: "gimnasia",
    name: "Gimnasia La Plata",
    shortName: "GIM",
    crest: "",
    primaryColor: "#FFFFFF",
    secondaryColor: "#1F4E9C",
  },
  {
    id: "flamengo",
    name: "Flamengo",
    shortName: "FLA",
    crest: "",
    primaryColor: "#C8102E",
    secondaryColor: "#0B0B0B",
  },
  {
    id: "palmeiras",
    name: "Palmeiras",
    shortName: "PAL",
    crest: "",
    primaryColor: "#006437",
    secondaryColor: "#FFFFFF",
  },
  {
    id: "nacional",
    name: "Nacional",
    shortName: "NAC",
    crest: "",
    primaryColor: "#FFFFFF",
    secondaryColor: "#1F4E9C",
  },
];

export const COMPETITIONS: Competition[] = [
  {
    id: "liga-2026",
    slug: "liga-profesional",
    name: "Liga Profesional",
    shortName: "Liga",
    type: "league",
    seasonLabel: "2026",
  },
  {
    id: "libertadores-2026",
    slug: "copa-libertadores",
    name: "CONMEBOL Libertadores",
    shortName: "Libertadores",
    type: "international",
    seasonLabel: "2026",
  },
  {
    id: "copa-argentina-2026",
    slug: "copa-argentina",
    name: "Copa Argentina",
    shortName: "Copa Argentina",
    type: "cup",
    seasonLabel: "2026",
  },
  {
    id: "trofeo-campeones-2026",
    slug: "trofeo-de-campeones",
    name: "Trofeo de Campeones",
    shortName: "Trofeo",
    type: "cup",
    seasonLabel: "2026",
  },
];

export const SEASON: Season = {
  id: "2026",
  label: "Temporada 2026",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  isActive: true,
  competitionIds: COMPETITIONS.map((competition) => competition.id),
};

export function getTeamById(id: string): Team | null {
  return TEAMS.find((team) => team.id === id) ?? null;
}

export function getCompetitionById(id: string): Competition | null {
  return COMPETITIONS.find((competition) => competition.id === id) ?? null;
}

export function getCompetitionType(id: string): Competition["type"] | null {
  return COMPETITIONS.find((competition) => competition.id === id)?.type ?? null;
}
