import type { Metadata } from "next";
import { Suspense } from "react";
import { NewsFeed } from "@/components/news/news-feed";
import { newsRepository } from "@/data/repositories";

export const metadata: Metadata = {
  title: "Novedades",
  description:
    "Últimas noticias de River Plate: plantel profesional, inferiores, institucional y mercado de pases. Feed cronológico y filtrable.",
  alternates: { canonical: "/novedades" },
};

export default async function NovedadesPage() {
  const articles = await newsRepository.listArticles();

  return (
    <>
      <section className="relative overflow-hidden bg-inverse pb-20 pt-10 text-white md:pb-24 md:pt-14">
        <div className="pointer-events-none absolute inset-0 band-motif" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-24 -top-20 h-[380px] w-[380px] rotate-12 rounded-full bg-river/20 blur-3xl" aria-hidden="true" />
        <div className="container-page relative max-w-4xl">
          <p className="eyebrow text-white/55">
            <span className="inline-block h-px w-7 bg-river" aria-hidden="true" />
            Actualidad del club
          </p>
          <h1 className="mt-3 font-display text-5xl uppercase leading-[0.88] tracking-tight sm:text-6xl md:text-7xl">
            Novedades <span className="text-river-ink">de River</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
            Todo lo que pasa en el club, ordenado por lo más reciente. Filtrá por categoría,
            buscá por palabra clave y compartí la vista exacta desde la URL.
          </p>
        </div>
      </section>

      <div className="container-page pb-12 md:pb-16">
        <Suspense
          fallback={
            <div className="card -mt-8 p-6">
              <div className="h-10 animate-pulse rounded-full bg-paper-deep" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="h-64 animate-pulse rounded-2xl bg-paper-deep" />
                ))}
              </div>
            </div>
          }
        >
          <NewsFeed articles={articles} />
        </Suspense>
      </div>
    </>
  );
}
