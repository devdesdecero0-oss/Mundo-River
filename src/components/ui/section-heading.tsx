import Link from "next/link";
import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  actionLabel,
  tone = "light",
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  actionLabel?: string;
  tone?: "light" | "dark";
  children?: ReactNode;
}) {
  const dark = tone === "dark";
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className={`eyebrow ${dark ? "text-white/55" : "text-river-ink"}`}>
            <span className={`inline-block h-px w-7 ${dark ? "bg-white/40" : "bg-river"}`} aria-hidden="true" />
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={`mt-2 font-display text-3xl uppercase leading-[0.95] tracking-tight sm:text-4xl ${
            dark ? "text-white" : "text-ink"
          }`}
        >
          {title}
        </h2>
        {description ? (
          <p className={`mt-2.5 text-sm leading-relaxed sm:text-[0.95rem] ${dark ? "text-white/60" : "text-ink-muted"}`}>
            {description}
          </p>
        ) : null}
      </div>
      {href && actionLabel ? (
        <Link
          href={href}
          className={`btn ${dark ? "btn-ghost-light" : "btn-outline"} shrink-0 text-sm`}
        >
          {actionLabel}
          <span aria-hidden="true">→</span>
        </Link>
      ) : null}
      {children}
    </div>
  );
}
