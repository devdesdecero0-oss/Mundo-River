import Image from "next/image";
import type { Player } from "@/domain/types";

const SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-2xl",
  xl: "h-28 w-28 text-3xl",
} as const;

export function PlayerAvatar({
  player,
  size = "md",
  className = "",
}: {
  player: Pick<Player, "name" | "photo" | "shirtNumber">;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const initials = player.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  if (player.photo) {
    return (
      <Image
        src={player.photo}
        alt={`Foto de ${player.name}`}
        width={112}
        height={112}
        className={`rounded-full object-cover ${SIZES[size]} ${className}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-black/10 bg-gradient-to-br from-inverse to-inverse-muted font-display font-bold uppercase tracking-wide text-white shadow-inner ${SIZES[size]} ${className}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
