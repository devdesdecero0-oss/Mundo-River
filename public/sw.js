/*
 * Mundo River — Service Worker propio, sin dependencias.
 *
 * Estrategias:
 * - Navegación: red primero, copia de la última página visitada y fallback /offline.
 * - Assets estáticos: caché primero, red después.
 * - RSC, /api/, POST y otros orígenes: nunca se interceptan.
 *
 * Al cambiar cualquiera de estas reglas hay que subir CACHE_VERSION.
 */
const CACHE_VERSION = "v1";
const CACHE_PREFIX = "mr-";
const SHELL_CACHE = `${CACHE_PREFIX}shell-${CACHE_VERSION}`;
const PAGES_CACHE = `${CACHE_PREFIX}pages-${CACHE_VERSION}`;
const ASSETS_CACHE = `${CACHE_PREFIX}assets-${CACHE_VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, PAGES_CACHE, ASSETS_CACHE];

const OFFLINE_URL = "/offline";
const MAX_PAGES = 20;

const PRECACHE_URLS = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-192.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/brand/river-crest.svg",
];

const ASSET_PREFIXES = ["/_next/static/", "/icons/", "/images/", "/brand/", "/fonts/"];
const ASSET_EXTENSIONS = /\.(?:css|js|mjs|woff2?|png|jpe?g|webp|avif|svg|ico)$/i;
const STATIC_ASSET_PATTERN = /\/_next\/static\/[^"'\s\\]+/g;

function extractStaticAssets(html) {
  return [...new Set(html.match(STATIC_ASSET_PATTERN) || [])];
}

/** Guarda los chunks, estilos y fuentes que referencia un HTML de Next. */
async function cacheAssets(urls) {
  if (!urls.length) return;
  const cache = await caches.open(ASSETS_CACHE);
  await Promise.all(
    urls.map(async (url) => {
      try {
        if (await cache.match(url)) return;
        const response = await fetch(new Request(url, { cache: "reload" }));
        if (response.ok) await cache.put(url, response);
      } catch {
        // Un asset faltante no debe romper la instalación ni la navegación.
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE);
      const assets = new Set();

      // Se precachea cada URL por separado: si una falla, la instalación sigue.
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const response = await fetch(new Request(url, { cache: "reload" }));
            if (!response.ok) return;

            const isHtml = (response.headers.get("content-type") || "").includes("text/html");
            const html = isHtml ? await response.clone().text() : null;
            await shell.put(url, response);
            if (html) extractStaticAssets(html).forEach((asset) => assets.add(asset));
          } catch {
            // Sin red en la primera instalación: la app seguirá intentando luego.
          }
        }),
      );

      await cacheAssets([...assets]);
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && !CURRENT_CACHES.includes(key))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isRscRequest(request, url) {
  return request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
}

function isAssetRequest(pathname) {
  if (pathname === "/manifest.webmanifest") return true;
  if (ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return ASSET_EXTENSIONS.test(pathname);
}

async function savePage(request, response) {
  try {
    const cache = await caches.open(PAGES_CACHE);
    await cache.put(request, response);
    const keys = await cache.keys();
    const excess = keys.length - MAX_PAGES;
    for (let index = 0; index < excess; index += 1) {
      await cache.delete(keys[index]);
    }
  } catch {
    // La cuota puede estar llena: la respuesta igual se entrega.
  }
}

function minimalOfflineResponse() {
  return new Response(
    '<!doctype html><html lang="es-AR"><meta charset="utf-8"><title>Sin conexión</title><body style="font-family:system-ui;background:#0b0b0e;color:#f4f2ec;display:grid;place-items:center;min-height:100vh;margin:0"><p>Sin conexión. Volvé a intentar cuando recuperes internet.</p></body></html>',
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function handleNavigation(event) {
  const { request } = event;
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      const forCache = response.clone();
      const forText = response.clone();
      event.waitUntil(
        (async () => {
          const html = await forText.text();
          await savePage(request, forCache);
          await cacheAssets(extractStaticAssets(html));
        })().catch(() => undefined),
      );
    }
    return response;
  } catch {
    const cached = await caches.match(request, { cacheName: PAGES_CACHE });
    if (cached) return cached;

    // El shell precacheado vive aparte: permite abrir Inicio y /offline.
    const shell = await caches.match(request, { cacheName: SHELL_CACHE });
    if (shell) return shell;

    const url = new URL(request.url);
    if (url.pathname === OFFLINE_URL) {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
      return minimalOfflineResponse();
    }

    // El HTML de /offline corresponde a esa ruta: se redirige para que Next
    // hidrate la página correcta y no intente reconciliar otra URL.
    return Response.redirect(new URL(OFFLINE_URL, self.location.origin).toString(), 302);
  }
}

async function handleAsset(request) {
  // Los íconos y el escudo precacheados viven en la caché del shell.
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(ASSETS_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 504, statusText: "Fuera de línea" });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (isRscRequest(request, url)) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event));
    return;
  }

  if (isAssetRequest(url.pathname)) {
    event.respondWith(handleAsset(request));
  }
});
