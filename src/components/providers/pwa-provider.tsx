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
  isIosDevice,
  isStandalone,
  resolveInstallMode,
  shouldRegisterServiceWorker,
  type InstallMode,
} from "@/lib/pwa";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PwaContextValue {
  installMode: InstallMode;
  offline: boolean;
  updateAvailable: boolean;
  promptInstall: () => Promise<void>;
  applyUpdate: () => void;
  dismissUpdate: () => void;
}

const PwaContext = createContext<PwaContextValue>({
  installMode: "none",
  offline: false,
  updateAvailable: false,
  promptInstall: async () => undefined,
  applyUpdate: () => undefined,
  dismissUpdate: () => undefined,
});

export function PwaProvider({ children }: { children: ReactNode }) {
  const [installMode, setInstallMode] = useState<InstallMode>("none");
  const [offline, setOffline] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const promptEventRef = useRef<BeforeInstallPromptEvent | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const reloadOnControllerChangeRef = useRef(false);
  const iosRef = useRef(false);

  // Instalación: standalone, prompt nativo o instrucciones manuales en iOS.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(display-mode: standalone)");
    const ios = isIosDevice(navigator.userAgent, navigator.platform, navigator.maxTouchPoints);
    iosRef.current = ios;

    const resolveMode = (canPrompt: boolean) =>
      resolveInstallMode({
        installed: isStandalone(
          media.matches,
          Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
        ),
        canPrompt,
        ios,
      });

    setInstallMode(resolveMode(false));

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      promptEventRef.current = event as BeforeInstallPromptEvent;
      setInstallMode(resolveMode(true));
    };
    const onInstalled = () => {
      promptEventRef.current = null;
      setInstallMode("installed");
    };
    const onDisplayModeChange = () => {
      if (media.matches) setInstallMode("installed");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    media.addEventListener("change", onDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      media.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  // Estado de conexión para el aviso discreto.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // Service worker: registro solo en producción, sin romper la app si falla.
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (!shouldRegisterServiceWorker(process.env.NODE_ENV, "serviceWorker" in navigator)) return;

    let cancelled = false;

    const onControllerChange = () => {
      if (!reloadOnControllerChangeRef.current) return;
      reloadOnControllerChangeRef.current = false;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const watchWorker = (registration: ServiceWorkerRegistration, worker: ServiceWorker | null) => {
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (cancelled) return;
        // Un worker instalado con controlador existente es una versión nueva.
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          setUpdateAvailable(true);
        }
      });
    };

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        if (cancelled) return;
        registrationRef.current = registration;
        if (registration.waiting && navigator.serviceWorker.controller) {
          setUpdateAvailable(true);
        }
        watchWorker(registration, registration.installing);
        registration.addEventListener("updatefound", () => {
          watchWorker(registration, registration.installing);
        });
      })
      .catch(() => {
        // Sin service worker la app sigue funcionando normalmente.
      });

    // Al volver a la pestaña se consulta si hay una versión nueva.
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      void registrationRef.current?.update().catch(() => undefined);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const event = promptEventRef.current;
    if (!event) return;

    await event.prompt();
    const choice = await event.userChoice;
    promptEventRef.current = null;

    if (choice.outcome === "accepted") {
      setInstallMode("installed");
      return;
    }
    setInstallMode(iosRef.current ? "ios" : "none");
  }, []);

  const applyUpdate = useCallback(() => {
    const waiting = registrationRef.current?.waiting;
    if (!waiting) {
      setUpdateAvailable(false);
      return;
    }
    reloadOnControllerChangeRef.current = true;
    waiting.postMessage({ type: "SKIP_WAITING" });
  }, []);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  const value = useMemo(
    () => ({ installMode, offline, updateAvailable, promptInstall, applyUpdate, dismissUpdate }),
    [installMode, offline, updateAvailable, promptInstall, applyUpdate, dismissUpdate],
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa(): PwaContextValue {
  return useContext(PwaContext);
}
