import type {
  Competition,
  Match,
  PlayerMatchStats,
  Season,
  SquadSnapshot,
  Team,
} from "@/domain/types";
import { sortMatches } from "@/domain/matches";
import type {
  DataSource,
  DataSourceAware,
  MatchesRepository,
  SquadRepository,
} from "./contracts";
import { MockMatchesRepository, MockSquadRepository } from "./mock";
import { BzzoiroClient } from "@/data/providers/bzzoiro/client";
import {
  LEAGUE_META,
  RIVER_PROVIDER_TEAM_ID,
  buildSeason,
  mapCompetition,
  mapIncidents,
  mapLineups,
  mapMatch,
  mapPlayerStats,
  mapSquad,
  mapStats,
  mapTeams,
  mapVenueName,
  providerMatchId,
} from "@/data/providers/bzzoiro/mappers";
import {
  bzzoiroEventDetailSchema,
  bzzoiroEventListSchema,
  bzzoiroIncidentsSchema,
  bzzoiroLeagueSchema,
  bzzoiroLineupsSchema,
  bzzoiroPlayerStatsSchema,
  bzzoiroSquadSchema,
  bzzoiroStatsSchema,
  bzzoiroVenueSchema,
  type BzzoiroEvent,
  type BzzoiroLeague,
} from "@/data/providers/bzzoiro/schemas";

const MATCHES_TTL = 5 * 60_000;
const SQUAD_TTL = 6 * 60 * 60_000;
const LIVE_REVALIDATE = 20;
const FINISHED_REVALIDATE = 60 * 60;
const LEAGUE_REVALIDATE = 6 * 60 * 60;
const VENUE_REVALIDATE = 24 * 60 * 60;

const LEAGUE_NAME_FALLBACK: Record<number, string> = {
  85: "Liga Profesional de Fútbol",
  33: "Copa Sudamericana",
  79: "Amistosos",
};

interface SeasonBundle {
  fetchedAt: number;
  year: number;
  events: BzzoiroEvent[];
  leagues: Map<number, BzzoiroLeague | null>;
  venues: Map<number, string | undefined>;
}

export interface BzzoiroMatchesRepositoryOptions {
  token: string;
  year?: number;
  client?: BzzoiroClient;
}

/** Repositorio de partidos respaldado por Bzzoiro Sports Data v2. */
export class BzzoiroMatchesRepository implements MatchesRepository, DataSourceAware {
  private readonly client: BzzoiroClient;
  private readonly year: number;
  private bundle: SeasonBundle | null = null;
  private bundlePromise: Promise<SeasonBundle> | null = null;
  private source: DataSource = "live";
  private readonly mock = new MockMatchesRepository();

  constructor(options: BzzoiroMatchesRepositoryOptions) {
    this.client =
      options.client ?? new BzzoiroClient({ token: options.token, retries: 2 });
    this.year = options.year ?? new Date().getFullYear();
  }

  getDataSource(): DataSource {
    return this.source;
  }

  async getSeason(): Promise<Season> {
    try {
      const bundle = await this.loadBundle();
      const competitions = this.competitionsFromBundle(bundle);
      return buildSeason(
        bundle.year,
        competitions.map((competition) => competition.id),
      );
    } catch {
      this.source = "fallback";
      return this.mock.getSeason();
    }
  }

  async getCompetitions(): Promise<Competition[]> {
    try {
      return this.competitionsFromBundle(await this.loadBundle());
    } catch {
      this.source = "fallback";
      return this.mock.getCompetitions();
    }
  }

  async getTeams(): Promise<Team[]> {
    try {
      return mapTeams((await this.loadBundle()).events);
    } catch {
      this.source = "fallback";
      return this.mock.getTeams();
    }
  }

  async listMatches(): Promise<Match[]> {
    try {
      const bundle = await this.loadBundle();
      const matches = bundle.events.map((event) =>
        mapMatch(event, {
          venueName: event.venue_id ? bundle.venues.get(event.venue_id) : undefined,
          seasonId: String(bundle.year),
        }),
      );
      this.source = "live";
      return sortMatches(matches, "asc");
    } catch {
      this.source = "fallback";
      return this.mock.listMatches();
    }
  }

  async getMatch(id: string): Promise<Match | null> {
    const eventId = parseProviderEventId(id);
    if (eventId === null) return null;

    try {
      const detail = await this.client.get(
        `events/${eventId}/`,
        bzzoiroEventDetailSchema,
        {
          revalidate: LIVE_REVALIDATE,
          tags: ["matches", `match:${eventId}`],
          allowNotFound: true,
        },
      );
      if (!detail) return null;

      const live = detail.status === "inprogress";
      const revalidate = live
        ? LIVE_REVALIDATE
        : detail.status === "notstarted"
          ? 300
          : FINISHED_REVALIDATE;
      const tags = ["matches", `match:${eventId}`];

      const [venue, incidents, stats, lineups] = await Promise.all([
        detail.venue_id
          ? this.loadVenue(detail.venue_id)
          : Promise.resolve(undefined),
        this.client
          .get(`events/${eventId}/incidents/`, bzzoiroIncidentsSchema, {
            revalidate,
            tags,
            allowNotFound: true,
          })
          .catch(() => null),
        this.client
          .get(`events/${eventId}/stats/`, bzzoiroStatsSchema, {
            revalidate,
            tags,
            allowNotFound: true,
          })
          .catch(() => null),
        this.client
          .get(`events/${eventId}/lineups/`, bzzoiroLineupsSchema, {
            revalidate,
            tags,
            allowNotFound: true,
          })
          .catch(() => null),
      ]);

      const match = mapMatch(detail, {
        venueName: venue,
        seasonId: String(this.year),
      });

      if (incidents) {
        match.events = mapIncidents(incidents.incidents, {
          matchId: match.id,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
        });
      }
      if (stats) match.stats = mapStats(stats);
      if (lineups) match.lineups = mapLineups(lineups, match.id);

      this.source = "live";
      return match;
    } catch (error) {
      console.error(`[bzzoiro] No se pudo cargar el partido ${id}.`, error);
      this.source = "fallback";
      return null;
    }
  }

  async getMatchPlayerStats(matchId: string): Promise<PlayerMatchStats[]> {
    const eventId = parseProviderEventId(matchId);
    if (eventId === null) return [];

    try {
      return await this.fetchPlayerStats(eventId, LIVE_REVALIDATE);
    } catch {
      this.source = "fallback";
      return [];
    }
  }

  async listPlayerStats(): Promise<PlayerMatchStats[]> {
    try {
      const matches = await this.listMatches();
      const finished = matches.filter(
        (match) => match.providerStatus === "finished" && parseProviderEventId(match.id) !== null,
      );

      const rows = await mapLimit(finished, 4, async (match) => {
        const eventId = parseProviderEventId(match.id);
        if (eventId === null) return [];
        try {
          return await this.fetchPlayerStats(eventId, FINISHED_REVALIDATE);
        } catch {
          return [];
        }
      });

      return rows.flat();
    } catch {
      this.source = "fallback";
      return [];
    }
  }

  private async fetchPlayerStats(
    eventId: number,
    revalidate: number,
  ): Promise<PlayerMatchStats[]> {
    const payload = await this.client.get(
      `events/${eventId}/player-stats/`,
      bzzoiroPlayerStatsSchema,
      {
        revalidate,
        tags: ["player-stats", `match:${eventId}`],
        allowNotFound: true,
      },
    );
    if (!payload) return [];

    return mapPlayerStats(
      payload.player_stats.filter((raw) => raw.team_id === RIVER_PROVIDER_TEAM_ID),
      providerMatchId(eventId),
    );
  }

  private async loadBundle(): Promise<SeasonBundle> {
    if (this.bundle && Date.now() - this.bundle.fetchedAt < MATCHES_TTL) {
      return this.bundle;
    }
    if (this.bundlePromise) return this.bundlePromise;

    this.bundlePromise = this.fetchBundle()
      .then((bundle) => {
        this.bundle = bundle;
        this.source = "live";
        return bundle;
      })
      .finally(() => {
        this.bundlePromise = null;
      });

    return this.bundlePromise;
  }

  private async fetchBundle(): Promise<SeasonBundle> {
    const payload = await this.client.get(
      `events/?team_id=${RIVER_PROVIDER_TEAM_ID}&date_from=${this.year}-01-01&date_to=${this.year}-12-31&limit=200`,
      bzzoiroEventListSchema,
      { revalidate: 300, tags: ["matches"] },
    );

    const events = payload.results.filter((event) => {
      if (event.replaced_by !== undefined && event.replaced_by !== null) return false;
      return !Number.isNaN(new Date(event.event_date).getTime());
    });

    const leagueIds = [...new Set(events.map((event) => event.league_id))];
    const venueIds = [
      ...new Set(events.map((event) => event.venue_id).filter((id): id is number => typeof id === "number")),
    ];

    const [leagues, venues] = await Promise.all([
      mapLimit(leagueIds, 4, async (leagueId) => {
        try {
          const league = await this.client.get(
            `leagues/${leagueId}/`,
            bzzoiroLeagueSchema,
            {
              revalidate: LEAGUE_REVALIDATE,
              tags: ["leagues", `league:${leagueId}`],
              allowNotFound: true,
            },
          );
          return [leagueId, league] as const;
        } catch {
          return [leagueId, null] as const;
        }
      }),
      mapLimit(venueIds, 4, async (venueId) => {
        try {
          const venue = await this.client.get(
            `venues/${venueId}/`,
            bzzoiroVenueSchema,
            {
              revalidate: VENUE_REVALIDATE,
              tags: ["venues", `venue:${venueId}`],
              allowNotFound: true,
            },
          );
          return [venueId, venue ? mapVenueName(venue) : undefined] as const;
        } catch {
          return [venueId, undefined] as const;
        }
      }),
    ]);

    return {
      fetchedAt: Date.now(),
      year: this.year,
      events,
      leagues: new Map(leagues),
      venues: new Map(venues),
    };
  }

  private competitionsFromBundle(bundle: SeasonBundle): Competition[] {
    const seen = new Set<string>();
    const competitions: Competition[] = [];

    for (const event of bundle.events) {
      const key = `${event.league_id}-${event.season_id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const league = bundle.leagues.get(event.league_id) ?? fallbackLeague(event, bundle.year);
      competitions.push(mapCompetition(league, event.season_id));
    }

    const order: Record<string, number> = { league: 0, international: 1, cup: 2, friendly: 3 };
    return competitions.sort(
      (a, b) =>
        (order[a.type] ?? 9) - (order[b.type] ?? 9) ||
        a.name.localeCompare(b.name, "es-AR"),
    );
  }

  private async loadVenue(venueId: number): Promise<string | undefined> {
    try {
      const venue = await this.client.get(
        `venues/${venueId}/`,
        bzzoiroVenueSchema,
        {
          revalidate: VENUE_REVALIDATE,
          tags: ["venues", `venue:${venueId}`],
          allowNotFound: true,
        },
      );
      return venue ? mapVenueName(venue) : undefined;
    } catch {
      return undefined;
    }
  }
}

export interface BzzoiroSquadRepositoryOptions {
  token: string;
  year?: number;
  client?: BzzoiroClient;
}

/** Repositorio del plantel respaldado por Bzzoiro, con caché de 6 horas. */
export class BzzoiroSquadRepository implements SquadRepository, DataSourceAware {
  private readonly client: BzzoiroClient;
  private readonly year: number;
  private readonly mock = new MockSquadRepository();
  private cache: { at: number; squad: SquadSnapshot } | null = null;
  private pending: Promise<SquadSnapshot> | null = null;
  private source: DataSource = "live";

  constructor(options: BzzoiroSquadRepositoryOptions) {
    this.client =
      options.client ?? new BzzoiroClient({ token: options.token, retries: 2 });
    this.year = options.year ?? new Date().getFullYear();
  }

  getDataSource(): DataSource {
    return this.source;
  }

  async getSquad(): Promise<SquadSnapshot> {
    if (this.cache && Date.now() - this.cache.at < SQUAD_TTL) {
      return this.cache.squad;
    }
    if (this.pending) return this.pending;

    this.pending = this.fetchSquad()
      .then((squad) => {
        this.cache = { at: Date.now(), squad };
        this.source = "live";
        return squad;
      })
      .catch(() => {
        this.source = "fallback";
        return this.mock.getSquad();
      })
      .finally(() => {
        this.pending = null;
      });

    return this.pending;
  }

  private async fetchSquad(): Promise<SquadSnapshot> {
    const payload = await this.client.get(
      `teams/${RIVER_PROVIDER_TEAM_ID}/squad/`,
      bzzoiroSquadSchema,
      { revalidate: SQUAD_TTL / 1000, tags: ["squad"] },
    );
    return mapSquad(payload, {
      seasonId: String(this.year),
      fetchedAt: new Date().toISOString(),
    });
  }
}

export function parseProviderEventId(matchId: string): number | null {
  let normalized = matchId.trim();
  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    // Un segmento mal codificado no debe romper la ruta: se valida tal cual.
  }
  const match = /^(?:bzzoiro:event:)?(\d+)$/.exec(normalized);
  if (!match?.[1]) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) ? id : null;
}

function fallbackLeague(event: BzzoiroEvent, year: number): BzzoiroLeague {
  const meta = LEAGUE_META[event.league_id];
  return {
    id: event.league_id,
    name: LEAGUE_NAME_FALLBACK[event.league_id] ?? `Liga ${event.league_id}`,
    country: "Argentina",
    is_active: true,
    current_season: {
      id: event.season_id,
      name: `${meta?.shortName ?? "Temporada"} ${year}`,
      year,
      start_date: `${year}-01-01`,
      end_date: `${year}-12-31`,
      is_current: true,
    },
  };
}

async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function run(): Promise<void> {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= items.length) return;
      const item = items[index];
      if (item === undefined) continue;
      results[index] = await worker(item, index);
    }
  }

  const safeLimit = Math.max(1, Math.min(limit, items.length || 1));
  await Promise.all(Array.from({ length: safeLimit }, () => run()));
  return results;
}
