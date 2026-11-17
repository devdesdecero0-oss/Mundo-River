import { describe, expect, it } from "vitest";
import {
  isIosDevice,
  isStandalone,
  resolveInstallMode,
  shouldRegisterServiceWorker,
} from "@/lib/pwa";

describe("pwa — detección de plataforma", () => {
  it("considera standalone si el display-mode o Safari lo indican", () => {
    expect(isStandalone(true, false)).toBe(true);
    expect(isStandalone(false, true)).toBe(true);
    expect(isStandalone(false, false)).toBe(false);
  });

  it("detecta iPhone, iPad e iPod por user agent", () => {
    expect(
      isIosDevice(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        "iPhone",
        5,
      ),
    ).toBe(true);
    expect(
      isIosDevice(
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        "iPad",
        5,
      ),
    ).toBe(true);
    expect(isIosDevice("Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0)", "iPod", 5)).toBe(true);
  });

  it("detecta iPadOS moderno que se presenta como MacIntel", () => {
    expect(
      isIosDevice(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
        "MacIntel",
        5,
      ),
    ).toBe(true);
  });

  it("no confunde una Mac de escritorio ni Android con iOS", () => {
    expect(
      isIosDevice(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
        "MacIntel",
        0,
      ),
    ).toBe(false);
    expect(
      isIosDevice(
        "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/120.0",
        "Linux armv8l",
        5,
      ),
    ).toBe(false);
  });
});

describe("pwa — modo de instalación", () => {
  it("prioriza instalada sobre cualquier otro estado", () => {
    expect(resolveInstallMode({ installed: true, canPrompt: true, ios: true })).toBe("installed");
  });

  it("usa el prompt nativo cuando el navegador lo ofrece", () => {
    expect(resolveInstallMode({ installed: false, canPrompt: true, ios: true })).toBe("prompt");
  });

  it("cae a instrucciones manuales en iOS", () => {
    expect(resolveInstallMode({ installed: false, canPrompt: false, ios: true })).toBe("ios");
  });

  it("no muestra instalación en navegadores sin soporte", () => {
    expect(resolveInstallMode({ installed: false, canPrompt: false, ios: false })).toBe("none");
  });
});

describe("pwa — registro del service worker", () => {
  it("registra solo en producción y con soporte del navegador", () => {
    expect(shouldRegisterServiceWorker("production", true)).toBe(true);
  });

  it("no registra en desarrollo", () => {
    expect(shouldRegisterServiceWorker("development", true)).toBe(false);
    expect(shouldRegisterServiceWorker("test", true)).toBe(false);
  });

  it("no registra si el navegador no soporta service workers", () => {
    expect(shouldRegisterServiceWorker("production", false)).toBe(false);
  });
});
