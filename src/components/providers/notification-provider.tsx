"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isIosDevice, isStandalone } from "@/lib/pwa";

type NotificationStatus =
  | "unsupported"
  | "default"
  | "granted"
  | "denied"
  | "subscribed"
  | "ios"
  | "error";

interface NotificationContextValue {
  status: NotificationStatus;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  status: "unsupported",
  subscribe: async () => undefined,
  unsubscribe: async () => undefined,
});

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<NotificationStatus>("unsupported");

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !PUBLIC_KEY) return;

    const ios = isIosDevice(navigator.userAgent, navigator.platform, navigator.maxTouchPoints);
    const standalone = isStandalone(
      window.matchMedia("(display-mode: standalone)").matches,
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
    );
    if (ios && !standalone) {
      setStatus("ios");
      return;
    }

    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    if (Notification.permission === "default") {
      setStatus("default");
      return;
    }

    void navigator.serviceWorker.ready
      .then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        setStatus(subscription ? "subscribed" : "granted");
      })
      .catch(() => setStatus("error"));
  }, []);

  const subscribe = useCallback(async () => {
    if (!PUBLIC_KEY || !("Notification" in window) || !("serviceWorker" in navigator)) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        sessionStorage.setItem("mr_notifications_dismissed", "1");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodePublicKey(PUBLIC_KEY),
        }));

      const response = await fetch("/api/notificaciones/suscripcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error("No se pudo registrar la suscripción.");
      setStatus("subscribed");
    } catch {
      setStatus("error");
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setStatus("granted");
        return;
      }
      const response = await fetch("/api/notificaciones/suscripcion", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      if (!response.ok) throw new Error("No se pudo eliminar la suscripción.");
      await subscription.unsubscribe();
      setStatus("granted");
    } catch {
      setStatus("error");
    }
  }, []);

  const value = useMemo(() => ({ status, subscribe, unsubscribe }), [status, subscribe, unsubscribe]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

function decodePublicKey(value: string): ArrayBuffer {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const bytes = Uint8Array.from(raw, (character) => character.charCodeAt(0));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function useNotifications(): NotificationContextValue {
  return useContext(NotificationContext);
}
