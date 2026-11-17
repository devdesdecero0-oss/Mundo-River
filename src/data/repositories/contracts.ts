import type {
  Competition,
  Match,
  NewsArticle,
  PlayerMatchStats,
  Season,
  SquadSnapshot,
  Team,
} from "@/domain/types";
import type { LigaProfesionalStandings } from "@/domain/standings";

/**
 * Contratos de repositorio. La UI consume estas interfaces, nunca los
 * fixtures ni el proveedor directamente.
 */
export interface MatchesRepository {
  getSeason(): Promise<Season>;
  getCompetitions(): Promise<Competition[]>;
  getTeams(): Promise<Team[]>;
  listMatches(): Promise<Match[]>;
  getMatch(id: string): Promise<Match | null>;
  getMatchPlayerStats(matchId: string): Promise<PlayerMatchStats[]>;
  /** Estadísticas de todos los partidos en una sola llamada (evita N+1 en temporada). */
  listPlayerStats(): Promise<PlayerMatchStats[]>;
}

export interface StandingsRepository {
  getLigaProfesional(): Promise<LigaProfesionalStandings>;
}

export interface NewsRepository {
  listArticles(): Promise<NewsArticle[]>;
  getArticleBySlug(slug: string): Promise<NewsArticle | null>;
}

export interface SquadRepository {
  getSquad(): Promise<SquadSnapshot>;
}

export type DataSource = "live" | "mock" | "fallback";

/** Origen efectivo de los datos, para avisos no bloqueantes en la UI. */
export interface DataSourceAware {
  getDataSource(): DataSource;
}
