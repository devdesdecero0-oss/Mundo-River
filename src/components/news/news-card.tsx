import Image from "next/image";
import Link from "next/link";
import { categoryLabel, computeReadingTime } from "@/domain/news";
import type { NewsArticle } from "@/domain/types";
import { LocalDate } from "@/components/ui/local-date";

const CATEGORY_STYLES: Record<NewsArticle["category"], string> = {
  "plantel-profesional": "bg-river text-white",
  inferiores: "bg-[#0e7a3c] text-white",
  institucional: "bg-strong text-on-strong",
  "mercado-de-pases": "bg-gold text-on-light",
};

export function CategoryPill({
  category,
  className = "",
}: {
  category: NewsArticle["category"];
  className?: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 font-display text-[0.66rem] font-semibold uppercase tracking-[0.12em] ${CATEGORY_STYLES[category]} ${className}`}
    >
      {categoryLabel(category)}
    </span>
  );
}

export function NewsBrandMark() {
  return (
    <span className="absolute bottom-3 right-3 z-10 rounded-full bg-inverse/80 px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.16em] text-white">
      Mundo River
    </span>
  );
}

export function NewsCard({
  article,
  featured = false,
  priority = false,
}: {
  article: NewsArticle;
  featured?: boolean;
  priority?: boolean;
}) {
  const readingTime = computeReadingTime(article.body);
  const isAggregator = article.body.length === 0;

  return (
    <article className="group h-full">
      <Link
        href={`/novedades/${article.slug}`}
        className="card card-hover flex h-full flex-col overflow-hidden"
        aria-label={article.title}
      >
        <div className={`relative overflow-hidden ${featured ? "aspect-[16/9]" : "aspect-[16/10]"}`}>
          <Image
            src={article.coverImage}
            alt=""
            width={1200}
            height={675}
            priority={priority}
            unoptimized
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-inverse/45 via-transparent to-transparent" aria-hidden="true" />
          <NewsBrandMark />
          <div className="absolute left-3 top-3">
            <CategoryPill category={article.category} />
          </div>
          {isAggregator ? (
            <span className="absolute right-3 top-3 rounded-full bg-inverse/80 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wide text-white">
              Fuente externa ↗
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3
            className={`font-display uppercase leading-[1.06] tracking-tight text-ink transition-colors group-hover:text-river-ink ${
              featured ? "text-2xl sm:text-[1.7rem]" : "text-xl"
            }`}
          >
            {article.title}
          </h3>
          <p className={`mt-2 text-sm leading-relaxed text-ink-muted ${featured ? "line-clamp-3" : "line-clamp-2"}`}>
            {article.excerpt}
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-4 text-[0.72rem] font-semibold uppercase tracking-wide text-ink-muted">
            <LocalDate value={article.publishedAt} />
            <span aria-hidden="true">·</span>
            {isAggregator ? (
              <span>Fuente: {article.sourceName ?? article.author}</span>
            ) : (
              <span>{readingTime} min de lectura</span>
            )}
            {article.featured ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-river-ink">Destacado</span>
              </>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
