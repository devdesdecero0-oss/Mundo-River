import { z } from "zod";

/**
 * Esquemas Zod de las respuestas de Bzzoiro Sports Data v2.
 *
 * Son deliberadamente tolerantes: solo validan los campos que usamos.
 * Si el proveedor agrega campos, el parseo sigue funcionando.
 */

const nullableNumber = z.number().nullable().optional();
const nullableString = z.string().nullable().optional();

export const bzzoiroEventSchema = z
  .object({
    id: z.number(),
    league_id: z.number(),
    season_id: z.number(),
    home_team_id: z.number(),
    home_team: z.string(),
    away_team_id: z.number(),
    away_team: z.string(),
    event_date: z.string(),
    status: z.string(),
    replaced_by: nullableNumber,
    round_number: nullableNumber,
    round_name: nullableString,
    group_name: nullableString,
    stage: nullableString,
    stage_name: nullableString,
    round_label: nullableString,
    period: nullableString,
    current_minute: nullableNumber,
    home_score: nullableNumber,
    away_score: nullableNumber,
    home_score_ht: nullableNumber,
    away_score_ht: nullableNumber,
    penalty_shootout: z.unknown().nullable().optional(),
    extra_time_score: z.unknown().nullable().optional(),
    venue_id: nullableNumber,
    attendance: nullableNumber,
  })
  .passthrough();

export type BzzoiroEvent = z.infer<typeof bzzoiroEventSchema>;

export const bzzoiroEventListSchema = z
  .object({
    count: z.number().optional(),
    results: z.array(bzzoiroEventSchema),
  })
  .passthrough();

export const bzzoiroEventDetailSchema = bzzoiroEventSchema
  .extend({
    referee_id: nullableNumber,
    home_coach_id: nullableNumber,
    away_coach_id: nullableNumber,
  })
  .passthrough();

export type BzzoiroEventDetail = z.infer<typeof bzzoiroEventDetailSchema>;

export const bzzoiroVenueSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    city: nullableString,
    capacity: nullableNumber,
  })
  .passthrough();

export type BzzoiroVenue = z.infer<typeof bzzoiroVenueSchema>;

export const bzzoiroSeasonSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    year: z.number().nullable().optional(),
    start_date: nullableString,
    end_date: nullableString,
    is_current: z.boolean().optional(),
  })
  .passthrough();

export const bzzoiroLeagueSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    country: nullableString,
    is_active: z.boolean().optional(),
    current_season: bzzoiroSeasonSchema.nullable().optional(),
  })
  .passthrough();

export type BzzoiroLeague = z.infer<typeof bzzoiroLeagueSchema>;

export const bzzoiroIncidentSchema = z
  .object({
    type: z.string(),
    minute: nullableNumber,
    added_time: nullableNumber,
    is_home: z.boolean().optional(),
    player: nullableString,
    player_id: nullableNumber,
    player_in: nullableString,
    player_in_id: nullableNumber,
    player_out: nullableString,
    player_out_id: nullableNumber,
    assist: nullableString,
    reason: nullableString,
    card_type: nullableString,
    goal_type: nullableString,
    decision: nullableString,
    confirmed: z.boolean().optional(),
  })
  .passthrough();

export const bzzoiroIncidentsSchema = z
  .object({
    event_id: z.number().optional(),
    incidents: z.array(bzzoiroIncidentSchema),
  })
  .passthrough();

export type BzzoiroIncident = z.infer<typeof bzzoiroIncidentSchema>;

const teamStatsSchema = z
  .object({
    ball_possession: nullableNumber,
    total_shots: nullableNumber,
    shots_on_target: nullableNumber,
    corner_kicks: nullableNumber,
    fouls: nullableNumber,
    offsides: nullableNumber,
    passes: nullableNumber,
    pass_accuracy_pct: nullableNumber,
  })
  .passthrough();

export const bzzoiroStatsSchema = z
  .object({
    event_id: z.number().optional(),
    stats: z
      .object({
        home: teamStatsSchema.nullable().optional(),
        away: teamStatsSchema.nullable().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export const bzzoiroLineupPlayerSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    short_name: nullableString,
    position: nullableString,
    jersey_number: nullableNumber,
    captain: z.boolean().optional(),
  })
  .passthrough();

const teamLineupSchema = z
  .object({
    team_id: z.number(),
    team_name: z.string(),
    formation: nullableString,
    players: z.array(bzzoiroLineupPlayerSchema),
    substitutes: z.array(bzzoiroLineupPlayerSchema).optional(),
  })
  .passthrough();

export const bzzoiroLineupsSchema = z
  .object({
    event_id: z.number().optional(),
    lineup_status: nullableString,
    lineups: z
      .object({
        home: teamLineupSchema.nullable().optional(),
        away: teamLineupSchema.nullable().optional(),
      })
      .passthrough()
      .nullable(),
    unavailable_players: z.unknown().nullable().optional(),
  })
  .passthrough();

export type BzzoiroLineups = z.infer<typeof bzzoiroLineupsSchema>;

export const bzzoiroPlayerStatSchema = z
  .object({
    player_id: z.number(),
    team_id: z.number(),
    minutes_played: nullableNumber,
    rating: nullableNumber,
    goals: nullableNumber,
    goal_assist: nullableNumber,
    total_shots: nullableNumber,
    shots_on_target: nullableNumber,
    yellow_card: nullableNumber,
    red_card: nullableNumber,
  })
  .passthrough();

export const bzzoiroPlayerStatsSchema = z
  .object({
    event_id: z.number().optional(),
    count: z.number().optional(),
    player_stats: z.array(bzzoiroPlayerStatSchema),
  })
  .passthrough();

export type BzzoiroPlayerStat = z.infer<typeof bzzoiroPlayerStatSchema>;

export const bzzoiroSquadSchema = z
  .object({
    team_id: z.number(),
    count: z.number().optional(),
    players: z.array(
      z
        .object({
          id: z.number(),
          name: z.string(),
          short_name: nullableString,
          position: nullableString,
          jersey_number: nullableNumber,
          nationality: nullableString,
          date_of_birth: nullableString,
          availability: nullableString,
          injury_type: nullableString,
          injury_expected_return: nullableString,
        })
        .passthrough(),
    ),
  })
  .passthrough();

export type BzzoiroSquad = z.infer<typeof bzzoiroSquadSchema>;
