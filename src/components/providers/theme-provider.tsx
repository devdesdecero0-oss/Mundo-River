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
  applyTheme,
  nextTheme,
  parseThemeMessage,
  persistTheme,
  readDocumentTheme,
  resolveTheme,
  THEME_CHANNEL,
  type Theme,
} from "@/lib/theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => undefined,
  toggleTheme: () => undefined,
});

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: Theme | null;
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme ?? "light");
  const themeRef = useRef<Theme>(initialTheme ?? "light");
  const hasPreference = useRef(initialTheme !== null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const updateTheme = useCallback((next: Theme) => {
    themeRef.current = next;
    setThemeState(next);
    applyTheme(next);
  }, []);

  // El script temprano pudo resolver el sistema: sincronizamos el estado del cliente.
  useEffect(() => {
    const resolved = readDocumentTheme();
    if (!resolved) return;
    themeRef.current = resolved;
    setThemeState(resolved);
  }, []);

  // Sin preferencia manual, seguimos los cambios del sistema operativo.
  useEffect(() => {
    if (hasPreference.current || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => updateTheme(resolveTheme(null, media.matches));
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [updateTheme]);

  // Sincronización entre pestañas abiertas del mismo sitio.
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(THEME_CHANNEL);
    channel.onmessage = (event: MessageEvent<unknown>) => {
      const incoming = parseThemeMessage(event.data);
      if (!incoming) return;
      hasPreference.current = true;
      updateTheme(incoming);
    };
    channelRef.current = channel;
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [updateTheme]);

  const setTheme = useCallback(
    (next: Theme) => {
      hasPreference.current = true;
      updateTheme(next);
      persistTheme(next);
      channelRef.current?.postMessage({ type: "theme", value: next });
    },
    [updateTheme],
  );

  const toggleTheme = useCallback(() => {
    setTheme(nextTheme(themeRef.current));
  }, [setTheme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
