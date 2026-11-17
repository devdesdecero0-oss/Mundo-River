"use client";

import type { DateKey } from "@/domain/types";
import {
  formatDateKeyLong,
  formatLocalDateLong,
  formatLocalDateShort,
  formatLocalDateTime,
  formatLocalDateTimeLong,
  formatLocalDayHeader,
  formatLocalTime,
  formatMonthLabel,
} from "@/domain/time";
import { useNow, useTimeZone } from "@/components/providers/time-zone-provider";

type Variant = "short" | "long" | "datetime" | "datetimeLong" | "time" | "dateKeyLong";

export function LocalDate({
  value,
  variant = "short",
  className = "",
}: {
  value: string | Date;
  variant?: Variant;
  className?: string;
}) {
  const { timeZone } = useTimeZone();
  const dateTime = value instanceof Date ? value.toISOString() : value;

  const label =
    variant === "long"
      ? formatLocalDateLong(value, timeZone)
      : variant === "datetime"
        ? formatLocalDateTime(value, timeZone)
        : variant === "datetimeLong"
          ? formatLocalDateTimeLong(value, timeZone)
          : variant === "time"
            ? formatLocalTime(value, timeZone)
            : variant === "dateKeyLong"
              ? formatDateKeyLong(value as DateKey)
              : formatLocalDateShort(value, timeZone);

  return (
    <time dateTime={dateTime} className={className}>
      {label}
    </time>
  );
}

export function LocalDayHeader({
  dateKey,
  nowIso,
  className = "",
}: {
  dateKey: DateKey;
  nowIso?: string;
  className?: string;
}) {
  const { timeZone } = useTimeZone();
  const now = useNow(60_000, nowIso);
  return (
    <p className={className} data-date-key={dateKey}>
      {formatLocalDayHeader(dateKey, timeZone, now)}
    </p>
  );
}

export function LocalMonthLabel({ monthKey, className = "" }: { monthKey: string; className?: string }) {
  return <span className={className}>{formatMonthLabel(monthKey as `${number}-${number}`)}</span>;
}
