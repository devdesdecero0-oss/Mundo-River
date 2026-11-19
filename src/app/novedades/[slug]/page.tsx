import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NewsCard, CategoryPill, NewsBrandMark } from "@/components/news/news-card";
import { LocalDate } from "@/components/ui/local-date";
import { computeReadingTime, getRelatedArticles, sortNews } from "@/domain/news";
import { newsRepository } from "@/data/repositories";
import { SITE_NAME } from "@/lib/navigation";
import { SITE_URL } from "@/lib/site.server";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await newsRepository.getArticleBySlug(slug);
  if (!article) return { title: "Nota no encontrada" };

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/novedades/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      publishedTime: article.publishedAt,
      authors: [article.author],
      images: [{ url: article.coverImage, width: 1200, height: 675, alt: article.title }],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const [article, allArticles] = await Promise.all([
    newsRepository.getArticleBySlug(slug),
    newsRepository.listArticles(),
  ]);

  if (!article) notFound();

  const readingTime = computeReadingTime(article.body);
  const isAggregator = article.body.length === 0;
  const sourceName = article.sourceName ?? article.author;
  const related = getRelatedArticles(sortNews(allArticles), article, 3);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: [`${SITE_URL}${article.coverImage}`],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    author: { "@type": "Organization", name: sourceName },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/river-crest.svg` },
    },
    articleSection: article.category,
    keywords: article.tags.join(", "),
    inLanguage: "es-AR",
    mainEntityOfPage: article.externalUrl ?? `${SITE_URL}/novedades/${article.slug}`,
    ...(article.externalUrl ? { isBasedOn: article.externalUrl } : {}),
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-ink/10 bg-surface pb-8 pt-6 md:pb-10">
        <div className="container-page max-w-4xl">
          <nav aria-label="Migas de pan" className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-river-ink">Inicio</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/novedades" className="hover:text-river-ink">Novedades</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="truncate text-ink" aria-current="page">{article.title}</li>
            </ol>
          </nav>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <CategoryPill category={article.category} />
            {isAggregator ? (
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Fuente: {sourceName}
              </span>
            ) : (
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {readingTime} min de lectura
              </span>
            )}
            {article.featured ? (
              <span className="text-xs font-bold uppercase tracking-wide text-river-ink">Destacado</span>
            ) : null}
            {isAggregator ? (
              <span className="rounded-full bg-paper px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wide text-ink-muted">
                Enlace externo ↗
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 font-display text-4xl uppercase leading-[0.94] tracking-tight sm:text-5xl md:text-[3.4rem]">
            {article.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink-muted sm:text-lg">
            {article.excerpt}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink/10 pt-4 text-xs font-semibold text-ink-muted">
            <span className="text-ink">{sourceName}</span>
            <span aria-hidden="true">·</span>
            <LocalDate value={article.publishedAt} variant="datetime" />
            {article.updatedAt ? (
              <>
                <span aria-hidden="true">·</span>
                <span>Actualizado <LocalDate value={article.updatedAt} variant="datetime" /></span>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <div className="container-page max-w-4xl py-8 md:py-10">
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-ink/10 bg-paper-deep">
          <Image
            src={article.coverImage}
            alt={article.title}
            width={1200}
            height={675}
            priority
            unoptimized
            className="h-full w-full object-cover"
          />
          <NewsBrandMark />
        </div>

        {isAggregator ? (
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-ink/10 bg-surface p-6 text-center sm:p-8">
            <p className="eyebrow text-river-ink">Nota de {sourceName}</p>
            <h2 className="mt-2 font-display text-2xl uppercase leading-tight">
              Leé la cobertura completa en la fuente original
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">
              Mundo River publica el titular y una bajada informativa. El contenido completo de
              esta noticia pertenece a {sourceName}; abrí el enlace para leerla en su sitio.
            </p>
            {article.externalUrl ? (
              <a
                href={article.externalUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="btn btn-primary mt-5"
              >
                Ir a {sourceName}
                <span aria-hidden="true">↗</span>
              </a>
            ) : null}
            <p className="mt-4 text-[0.68rem] uppercase tracking-wide text-ink-muted">
              Sin copia del texto original · Enlace directo al medio
            </p>
          </div>
        ) : (
          <div className="prose-river mx-auto mt-8 max-w-3xl">
            {article.body.map((block, index) => {
              const key = `${block.type}-${index}`;
              if (block.type === "heading") {
                return <h2 key={key}>{block.text}</h2>;
              }
              if (block.type === "quote") {
                return (
                  <blockquote key={key}>
                    {block.text}
                    {block.caption ? (
                      <footer className="mt-2 text-xs font-sans font-semibold uppercase tracking-widest text-ink-muted">
                        — {block.caption}
                      </footer>
                    ) : null}
                  </blockquote>
                );
              }
              if (block.type === "image") {
                return (
                  <figure key={key} className="my-6">
                    <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
                      <Image
                        src={block.src ?? article.coverImage}
                        alt={block.alt ?? ""}
                        width={1200}
                        height={675}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {block.caption ? (
                      <figcaption className="mt-2 text-center text-xs text-ink-muted">{block.caption}</figcaption>
                    ) : null}
                  </figure>
                );
              }
              return <p key={key}>{block.text}</p>;
            })}
          </div>
        )}

        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap gap-2 border-t border-ink/10 pt-6">
          {article.tags.map((tag) => (
            <Link
              key={tag}
              href={`/novedades?q=${encodeURIComponent(tag)}`}
              className="chip"
            >
              #{tag}
            </Link>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          <Link href="/novedades" className="btn btn-outline">
            <span aria-hidden="true">←</span> Volver a Novedades
          </Link>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="border-t border-ink/10 bg-surface py-10 md:py-14" aria-labelledby="relacionadas">
          <div className="container-page">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-river-ink">Seguir leyendo</p>
                <h2 id="relacionadas" className="mt-2 font-display text-3xl uppercase">Notas relacionadas</h2>
              </div>
              <Link href="/novedades" className="text-xs font-bold uppercase tracking-wide text-river-ink hover:underline">
                Ver todas →
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <NewsCard key={item.id} article={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}
