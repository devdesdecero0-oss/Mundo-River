import type { FormResult } from "@/domain/types";
import type { StandingRow } from "@/domain/standings";
import type { BzzoiroStandingRow } from "./schemas";
import { providerTeamId } from "./mappers";

const FORM_RESULTS = new Set<FormResult>(["W", "D", "L"]);

export function mapStandingRow(row: BzzoiroStandingRow): StandingRow {
  return {
    position: row.position,
    teamId: providerTeamId(row.team_id),
    teamName: row.team_name,
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goalsFor: row.gf,
    goalsAgainst: row.ga,
    goalDifference: row.gd,
    points: row.pts,
    form: parseForm(row.form),
    zone: row.zone?.label ?? null,
  };
}

export function mapStandingGroups(
  groups: Readonly<Record<string, readonly BzzoiroStandingRow[]>>,
): Record<string, StandingRow[]> {
  return Object.fromEntries(
    Object.entries(groups).map(([name, rows]) => [
      name,
      rows.map((row) => mapStandingRow(row)),
    ]),
  );
}

function parseForm(value: string | null | undefined): FormResult[] {
  return [...(value ?? "")].filter((result): result is FormResult =>
    FORM_RESULTS.has(result as FormResult),
  );
}
