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
import type {
  NotificationErrorReason,
  NotificationStatus,
} from "@/domain/notifications";
import { isBraveBrowser, isIosDevice, isStandalone } from "@/lib/pwa";

interface NotificationContextValue {
  status: NotificationStatus;
  errorReason: NotificationErrorReason | null;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  status: "unsupported",
  errorReason: null,
  subscribe: async () => undefined,
  unsubscribe: async () => undefined,
});

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const NOTIFICATION_CHANNEL = "mr-notification-status";

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<NotificationStatus>("unsupported");
  const [errorReason, setErrorReason] = useState<NotificationErrorReason | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const refreshStatus = useCallback(async () => {
    setErrorReason(null);
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !PUBLIC_KEY) {
      setStatus("unsupported");
      return;
    }
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

    try {
      const registration = await navigator.serviceWorker.ready;
      if (!registration.pushManager) {
        setStatus("unsupported");
        return;
      }
      const subscription = await registration.pushManager.getSubscription();
      setStatus(subscription ? "subscribed" : "granted");
    } catch {
      setStatus("error");
      setErrorReason("service-worker");
    }
  }, []);

  const broadcastStatus = useCallback(
    (nextStatus: NotificationStatus, nextErrorReason: NotificationErrorReason | null = null) => {
      channelRef.current?.postMessage({
        type: "status",
        status: nextStatus,
        errorReason: nextErrorReason,
      });
    },
    [],
  );

  useEffect(() => {
    void refreshStatus();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void refreshStatus();
    };
    window.addEventListener("focus", refreshStatus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(NOTIFICATION_CHANNEL);
      channelRef.current = channel;
      channel.onmessage = (
        event: MessageEvent<{
          type?: string;
          status?: NotificationStatus;
          errorReason?: NotificationErrorReason | null;
        }>,
      ) => {
        if (event.data?.type === "status" && event.data.status) {
          setStatus(event.data.status);
          setErrorReason(event.data.errorReason ?? null);
        }
      };
    }

    return () => {
      window.removeEventListener("focus", refreshStatus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [refreshStatus]);

  const subscribe = useCallback(async () => {
    if (!PUBLIC_KEY || !("Notification" in window) || !("serviceWorker" in navigator)) return;
    try {
      setErrorReason(null);
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setErrorReason(null);
        broadcastStatus("denied");
        sessionStorage.setItem("mr_notifications_dismissed", "1");
        return;
      }

      let registration: ServiceWorkerRegistration;
      try {
        registration = await navigator.serviceWorker.ready;
      } catch {
        setStatus("error");
        setErrorReason("service-worker");
        broadcastStatus("error", "service-worker");
        return;
      }

      if (!registration.pushManager) {
        setStatus("unsupported");
        return;
      }

      let subscription: PushSubscription;
      try {
        subscription =
          (await registration.pushManager.getSubscription()) ??
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: decodePublicKey(PUBLIC_KEY),
          }));
      } catch {
        const reason = isBraveBrowser(navigator.userAgent, "brave" in navigator)
          ? "brave-settings"
          : "subscription";
        setStatus("error");
        setErrorReason(reason);
        broadcastStatus("error", reason);
        return;
      }

      const response = await fetch("/api/notificaciones/suscripcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error("No se pudo registrar la suscripción.");
      setStatus("subscribed");
      setErrorReason(null);
      broadcastStatus("subscribed");
    } catch {
      setStatus("error");
      setErrorReason("subscription");
      broadcastStatus("error");
    }
  }, [broadcastStatus]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setStatus("granted");
        broadcastStatus("granted");
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
      broadcastStatus("granted");
    } catch {
      setStatus("error");
      broadcastStatus("error");
    }
  }, [broadcastStatus]);

  const value = useMemo(
    () => ({ status, errorReason, subscribe, unsubscribe }),
    [status, errorReason, subscribe, unsubscribe],
  );
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
