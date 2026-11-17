import type { Team } from "@/domain/types";
import { ClubCrest } from "./club-crest";

export function TeamBadge({
  team,
  size = "md",
  className = "",
}: {
  team: Team;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (team.id === "river") {
    return (
      <span className={`inline-flex items-center justify-center ${className}`}>
        <ClubCrest size={size} />
      </span>
    );
  }

  const dimension = size === "sm" ? "h-8 w-8 text-[10px]" : size === "lg" ? "h-16 w-16 text-lg" : "h-11 w-11 text-xs";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-black/10 ring-1 ring-white/10 dark:border-white/25 dark:ring-white/15 font-display font-bold tracking-wider text-white shadow-sm ${dimension} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${team.primaryColor} 0%, ${team.primaryColor} 52%, ${team.secondaryColor} 52%, ${team.secondaryColor} 100%)`,
        textShadow: "0 1px 2px rgba(0,0,0,.5)",
      }}
      aria-label={`Escudo de ${team.name}`}
      role="img"
    >
      {team.shortName}
    </span>
  );
}
