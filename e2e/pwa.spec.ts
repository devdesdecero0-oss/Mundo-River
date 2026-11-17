import { expect, test } from "@playwright/test";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

test.describe("PWA instalable", () => {
  test("sirve el manifest con identidad, íconos y atajos", async ({ page, request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.ok()).toBe(true);

    const manifest = (await response.json()) as {
      name: string;
      short_name: string;
      display: string;
      start_url: string;
      scope: string;
      icons: { sizes: string; purpose?: string }[];
      shortcuts: { name: string; url: string }[];
    };

    expect(manifest.name).toBe("Mundo River");
    expect(manifest.short_name).toBe("Mundo River");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.icons.map((icon) => icon.sizes)).toEqual(
      expect.arrayContaining(["192x192", "512x512"]),
    );
    expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(true);
    expect(manifest.shortcuts.map((shortcut) => shortcut.url)).toEqual([
      "/calendario",
      "/novedades",
    ]);

    await page.goto("/");
    await expect(page.locator('link[rel="manifest"]').first()).toHaveAttribute(
      "href",
      /manifest\.webmanifest/,
    );
    await expect(page.locator('link[rel="apple-touch-icon"]').first()).toHaveAttribute(
      "href",
      /apple-touch-icon\.png/,
    );
  });

  test("sirve el service worker y lo registra con scope raíz", async ({ page, request }) => {
    const response = await request.get("/sw.js");
    expect(response.ok()).toBe(true);
    const source = await response.text();
    expect(source).toContain("SKIP_WAITING");
    expect(source).toContain("/offline");

    await page.goto("/");
    await page.waitForFunction(
      () => navigator.serviceWorker?.controller !== null,
      undefined,
      { timeout: 20_000 },
    );

    const details = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return {
        scope: registration?.scope ?? null,
        active: Boolean(registration?.active),
      };
    });

    expect(details.active).toBe(true);
    expect(details.scope).toBe("http://127.0.0.1:3100/");
  });

  test("sin conexión cae en /offline para rutas no visitadas", async ({ page, context }) => {
    await page.goto("/");
    await page.waitForFunction(
      () => navigator.serviceWorker?.controller !== null,
      undefined,
      { timeout: 20_000 },
    );

    await context.setOffline(true);
    await page.goto("/temporada?offline=1");

    await expect(page).toHaveURL(/\/offline$/);
    await expect(page.getByRole("heading", { name: "Se cortó la señal" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();

    await context.setOffline(false);
  });

  test("muestra y oculta el aviso sin conexión", async ({ page, context }) => {
    await page.goto("/");

    await context.setOffline(true);
    await expect(page.getByText("Sin conexión · mostrando datos guardados")).toBeVisible();

    await context.setOffline(false);
    await expect(page.getByText("Sin conexión · mostrando datos guardados")).toBeHidden();
  });
});

test.describe("instalación en iOS", () => {
  test.use({
    userAgent: IPHONE_UA,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  test("muestra las instrucciones para añadir a pantalla de inicio", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Abrir menú" }).click();
    const menu = page.locator("#mobile-menu");
    await menu.getByRole("button", { name: "Instalar app" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: /Sumala a tu iPhone o iPad/ }),
    ).toBeVisible();
    await expect(dialog.getByText("Añadir a pantalla de inicio")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
