import type { NewsRepository, StandingsRepository } from "./contracts";
import { readServerEnv, type ServerEnv } from "@/lib/env";
import {
  BzzoiroMatchesRepository,
  BzzoiroSquadRepository,
} from "./live";
import { RssNewsRepository } from "./live-news";
import {
  MockMatchesRepository,
  MockNewsRepository,
  MockSquadRepository,
  MockStandingsRepository,
} from "./mock";

export type {
  DataSource,
  DataSourceAware,
  MatchesRepository,
  NewsRepository,
  StandingsRepository,
  SquadRepository,
} from "./contracts";

interface Repositories {
  matches: BzzoiroMatchesRepository | MockMatchesRepository;
  news: NewsRepository;
  squad: BzzoiroSquadRepository | MockSquadRepository;
  standings: StandingsRepository;
}

/**
 * Selector de repositorios según `DATA_MODE`.
 *
 * - `mock`: fixtures deterministas (tests, E2E y desarrollo sin token).
 * - `live`: Bzzoiro para partidos y plantel; RSS para noticias.
 *
 * Si `live` no tiene token, cae a mock sin romper el render.
 */
function createRepositories(env: ServerEnv): Repositories {
  if (env.dataMode === "live" && env.bzzoiroToken) {
    return {
      matches: new BzzoiroMatchesRepository({ token: env.bzzoiroToken }),
      news: new RssNewsRepository({ feeds: env.newsFeeds }),
      squad: new BzzoiroSquadRepository({ token: env.bzzoiroToken }),
      standings: new BzzoiroMatchesRepository({ token: env.bzzoiroToken }),
    };
  }

  return {
    matches: new MockMatchesRepository(),
    news: new MockNewsRepository(),
    squad: new MockSquadRepository(),
    standings: new MockStandingsRepository(),
  };
}

const repositories = createRepositories(readServerEnv());

export const matchesRepository = repositories.matches;
export const newsRepository = repositories.news;
export const squadRepository = repositories.squad;
export const standingsRepository = repositories.standings;
