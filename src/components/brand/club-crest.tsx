"use client";

import Image from "next/image";
import { useState } from "react";

const SIZES = {
  xs: 24,
  sm: 36,
  md: 52,
  lg: 88,
  xl: 140,
  hero: 220,
} as const;

export type CrestSize = keyof typeof SIZES;

export function ClubCrest({
  size = "sm",
  className = "",
  priority = false,
  decorative = false,
}: {
  size?: CrestSize;
  className?: string;
  priority?: boolean;
  decorative?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const dimension = SIZES[size];

  return (
    <Image
      src={failed ? "/brand/river-crest-mono.svg" : "/brand/river-crest.svg"}
      alt={decorative ? "" : "Escudo de River Plate"}
      width={dimension}
      height={Math.round(dimension * 1.25)}
      priority={priority}
      unoptimized
      onError={() => setFailed(true)}
      className={`object-contain drop-shadow-sm ${className}`}
      aria-hidden={decorative || undefined}
    />
  );
}
