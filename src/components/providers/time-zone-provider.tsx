"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  detectBrowserTimeZone,
  FALLBACK_TIME_ZONE,
  persistTimeZone,
} from "@/lib/time-zone";

interface TimeZoneContextValue {
  timeZone: string;
  isHydrated: boolean;
  setTimeZone: (timeZone: string) => void;
}

const TimeZoneContext = createContext<TimeZoneContextValue>({
  timeZone: FALLBACK_TIME_ZONE,
  isHydrated: false,
  setTimeZone: () => undefined,
});

export function TimeZoneProvider({
  initialTimeZone,
  children,
}: {
  initialTimeZone: string;
  children: ReactNode;
}) {
  const [timeZone, setTimeZoneState] = useState(initialTimeZone);
  const [isHydrated, setIsHydrated] = useState(false);
  const detected = useRef(false);

  useEffect(() => {
    if (detected.current) return;
    detected.current = true;
    setIsHydrated(true);

    const browserTimeZone = detectBrowserTimeZone();
    if (browserTimeZone !== initialTimeZone) {
      setTimeZoneState(browserTimeZone);
      persistTimeZone(browserTimeZone);
    }
  }, [initialTimeZone]);

  const setTimeZone = useCallback((next: string) => {
    setTimeZoneState(next);
    persistTimeZone(next);
  }, []);

  const value = useMemo(
    () => ({ timeZone, isHydrated, setTimeZone }),
    [timeZone, isHydrated, setTimeZone],
  );

  return <TimeZoneContext.Provider value={value}>{children}</TimeZoneContext.Provider>;
}

export function useTimeZone(): TimeZoneContextValue {
  return useContext(TimeZoneContext);
}

/** Reloj local que se actualiza cada intervalo; útil para countdowns. */
export function useNow(intervalMs = 1000, initialNow?: string | Date): Date {
  const [now, setNow] = useState<Date>(() =>
    initialNow ? new Date(initialNow) : new Date(0),
  );

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
}
