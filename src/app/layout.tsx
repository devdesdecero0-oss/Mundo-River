import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@fontsource/barlow-condensed/400.css";
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource-variable/manrope/index.css";
import "./globals.css";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PwaProvider } from "@/components/providers/pwa-provider";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TimeZoneProvider } from "@/components/providers/time-zone-provider";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { UpdateBanner } from "@/components/ui/update-banner";
import { getRequestTimeZone } from "@/lib/time-zone.server";
import { getThemeInitScript, THEME_COLORS } from "@/lib/theme";
import { getRequestTheme } from "@/lib/theme.server";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/navigation";
import { SITE_URL } from "@/lib/site.server";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · Información y Match Center de River Plate`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["River Plate", "Mundo River", "fútbol", "Liga Profesional", "Copa Libertadores", "Match Center"],
  authors: [{ name: "Mundo River" }],
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: SITE_NAME,
    title: `${SITE_NAME} · Información y Match Center de River Plate`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/images/news/plantel.svg", width: 1200, height: 675, alt: "Mundo River" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · Información y Match Center`,
    description: SITE_DESCRIPTION,
    images: ["/images/news/plantel.svg"],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/brand/river-crest.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [timeZone, theme] = await Promise.all([getRequestTimeZone(), getRequestTheme()]);

  return (
    <html
      lang="es-AR"
      className={theme === "dark" ? "dark" : undefined}
      data-theme={theme ?? undefined}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-paper antialiased">
        <Script id="theme-init" strategy="beforeInteractive">
          {getThemeInitScript()}
        </Script>
        <ThemeProvider initialTheme={theme}>
          <PwaProvider>
            <NotificationProvider>
              <TimeZoneProvider initialTimeZone={timeZone}>
              <a
                href="#contenido"
                className="sr-only z-[100] rounded-md bg-river px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
              >
                Saltar al contenido
              </a>
              <SiteHeader />
              <main id="contenido">{children}</main>
              <SiteFooter />
              <OfflineBanner />
              <UpdateBanner />
              </TimeZoneProvider>
            </NotificationProvider>
          </PwaProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
