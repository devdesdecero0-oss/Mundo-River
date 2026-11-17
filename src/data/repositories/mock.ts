import type {
  Competition,
  Match,
  NewsArticle,
  PlayerMatchStats,
  Season,
  SquadSnapshot,
  Team,
} from "@/domain/types";
import { buildStandings, selectGroupForTeam } from "@/domain/standings";
import { isFinishedMatch } from "@/domain/stats";
import type { StandingsRepository } from "./contracts";
import { MATCHES, getMatchStats } from "@/data/fixtures/matches";
import { NEWS_ARTICLES } from "@/data/fixtures/news";
import { SQUAD_SNAPSHOT } from "@/data/fixtures/players";
import { COMPETITIONS, SEASON, TEAMS } from "@/data/fixtures/teams";
import type {
  DataSource,
  DataSourceAware,
  MatchesRepository,
  NewsRepository,
  SquadRepository,
} from "./contracts";

export class MockMatchesRepository implements MatchesRepository, DataSourceAware {
  async getSeason(): Promise<Season> {
    return SEASON;
  }

  async getCompetitions(): Promise<Competition[]> {
    return COMPETITIONS;
  }

  async getTeams(): Promise<Team[]> {
    return TEAMS;
  }

  async listMatches(): Promise<Match[]> {
    return MATCHES;
  }

  async getMatch(id: string): Promise<Match | null> {
    return MATCHES.find((match) => match.id === id) ?? null;
  }

  async getMatchPlayerStats(matchId: string): Promise<PlayerMatchStats[]> {
    return getMatchStats(matchId);
  }

  async listPlayerStats(): Promise<PlayerMatchStats[]> {
    return MATCHES.flatMap((match) => getMatchStats(match.id));
  }

  getDataSource(): DataSource {
    return "mock";
  }
}

export class MockNewsRepository implements NewsRepository, DataSourceAware {
  async listArticles(): Promise<NewsArticle[]> {
    return NEWS_ARTICLES;
  }

  async getArticleBySlug(slug: string): Promise<NewsArticle | null> {
    return NEWS_ARTICLES.find((article) => article.slug === slug) ?? null;
  }

  getDataSource(): DataSource {
    return "mock";
  }
}

export class MockSquadRepository implements SquadRepository, DataSourceAware {
  async getSquad(): Promise<SquadSnapshot> {
    return SQUAD_SNAPSHOT;
  }

  getDataSource(): DataSource {
    return "mock";
  }
}

export class MockStandingsRepository implements StandingsRepository {
  async getLigaProfesional() {
    const teamNames = new Map(TEAMS.map((team) => [team.id, team.name]));
    const annual = buildStandings(
      MATCHES.map((match) => ({
        id: match.id,
        stage: "group-stage",
        status: isFinishedMatch(match) ? "finished" : "scheduled",
        homeTeamId: match.homeTeamId,
        homeTeamName: teamNames.get(match.homeTeamId) ?? match.homeTeamId,
        awayTeamId: match.awayTeamId,
        awayTeamName: teamNames.get(match.awayTeamId) ?? match.awayTeamId,
        homeScore: match.score?.home,
        awayScore: match.score?.away,
      })),
    );

    return {
      seasonLabel: SEASON.label,
      annual,
      riverGroup: selectGroupForTeam({ "Grupo de River": annual }, "river"),
    };
  }
}
