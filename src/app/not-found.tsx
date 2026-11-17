import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página no encontrada",
  description: "La página que buscás no existe o cambió de dirección.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="eyebrow text-river-ink">Error 404</p>
      <p className="mt-3 font-display text-7xl font-bold leading-none text-ink/15 sm:text-8xl">404</p>
      <h1 className="mt-4 font-display text-4xl uppercase leading-none sm:text-5xl">
        Esta página no está en la cancha
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-muted">
        Puede que el enlace esté mal escrito o que el contenido ya no exista. Volvé a empezar
        desde alguno de estos accesos.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn btn-primary">
          Ir al inicio
        </Link>
        <Link href="/novedades" className="btn btn-outline">
          Ver novedades
        </Link>
        <Link href="/calendario" className="btn btn-outline">
          Ver calendario
        </Link>
      </div>
    </section>
  );
}
