import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/navigation";

const ICON_192 = "/icons/icon-192.png";
const ICON_512 = "/icons/icon-512.png";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: "es-AR",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b0b0e",
    theme_color: "#0b0b0e",
    categories: ["sports", "news"],
    icons: [
      { src: ICON_192, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: ICON_512, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Calendario",
        short_name: "Calendario",
        description: "Partidos y agenda de la temporada",
        url: "/calendario",
        icons: [{ src: ICON_192, sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Novedades",
        short_name: "Novedades",
        description: "Últimas noticias de River Plate",
        url: "/novedades",
        icons: [{ src: ICON_192, sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
