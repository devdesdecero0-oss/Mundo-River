"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  categoryFromSlug,
  categorySlug,
  countNewsByCategory,
  filterNews,
  NEWS_CATEGORIES,
  sortNews,
} from "@/domain/news";
import type { NewsArticle, NewsCategory } from "@/domain/types";
import { NewsCard } from "./news-card";

const PAGE_SIZE = 6;

const FILTERS: Array<{ id: NewsCategory | "all"; label: string }> = [
  { id: "all", label: "Todas" },
  ...NEWS_CATEGORIES.map((category) => ({ id: category.id, label: category.label })),
];

export function NewsFeed({ articles }: { articles: NewsArticle[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState<NewsCategory | "all">(() =>
    categoryFromSlug(searchParams.get("cat")),
  );
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [page, setPage] = useState(1);

  const deferredQuery = useDeferredValue(query);
  const sorted = useMemo(() => sortNews(articles), [articles]);
  const counts = useMemo(() => countNewsByCategory(sorted), [sorted]);
  const filtered = useMemo(
    () => filterNews(sorted, { category, query: deferredQuery }),
    [sorted, category, deferredQuery],
  );
  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  const feedTopRef = useRef<HTMLDivElement>(null);
  const resultLabel = `${filtered.length} ${filtered.length === 1 ? "nota" : "notas"}`;

  useEffect(() => {
    setPage(1);
  }, [category, deferredQuery]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("cat", categorySlug(category));
    if (deferredQuery.trim()) params.set("q", deferredQuery.trim());
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [category, deferredQuery, pathname, router, searchParams]);

  function selectCategory(next: NewsCategory | "all") {
    setCategory(next);
    feedTopRef.current?.focus({ preventScroll: true });
  }

  function resetFilters() {
    setCategory("all");
    setQuery("");
    feedTopRef.current?.focus({ preventScroll: true });
  }

  return (
    <div ref={feedTopRef} tabIndex={-1} className="scroll-mt-24 outline-none">
      <div className="card -mt-8 relative z-10 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="scrollbar-thin -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filtrar por categoría">
            {FILTERS.map((filter) => {
              const active = category === filter.id;
              const count = counts[filter.id];
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => selectCategory(filter.id)}
                  aria-pressed={active}
                  className={`chip shrink-0 ${active ? "chip-active" : ""}`}
                >
                  {filter.label}
                  <span className={`text-[0.7rem] ${active ? "text-white/55" : "text-ink-muted"}`}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="relative lg:w-72">
            <label htmlFor="news-search" className="sr-only">
              Buscar novedades
            </label>
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              id="news-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por título, etiqueta…"
              className="min-h-11 w-full rounded-full border border-ink/15 bg-paper pl-9 pr-9 text-sm outline-none transition-colors placeholder:text-ink-muted/80 focus:border-river focus:bg-surface"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:bg-ink/5"
                aria-label="Limpiar búsqueda"
              >
                ×
              </button>
            ) : null}
          </div>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {resultLabel}
          {deferredQuery ? ` para “${deferredQuery}”` : ""}
        </p>
      </div>

      <div className="mt-8 flex items-baseline justify-between gap-3">
        <p className="text-sm text-ink-muted">
          <span className="font-semibold text-ink">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "nota" : "notas"}
          {deferredQuery ? (
            <>
              {" "}para <span className="font-semibold text-ink">“{deferredQuery}”</span>
            </>
          ) : null}
        </p>
        {category !== "all" || query ? (
          <button type="button" onClick={resetFilters} className="text-xs font-bold uppercase tracking-wide text-river-ink hover:underline">
            Limpiar filtros
          </button>
        ) : null}
      </div>

      {visible.length > 0 ? (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((article, index) => (
              <div key={article.id} className="animate-rise" style={{ animationDelay: `${Math.min(index, 5) * 40}ms` }}>
                <NewsCard article={article} />
              </div>
            ))}
          </div>
          {hasMore ? (
            <div className="mt-8 text-center">
              <button type="button" onClick={() => setPage((value) => value + 1)} className="btn btn-ink">
                Cargar más notas
                <span className="text-white/50">({filtered.length - visible.length})</span>
              </button>
            </div>
          ) : (
            <p className="mt-8 text-center text-xs uppercase tracking-widest text-ink-muted">
              Llegaste al final
            </p>
          )}
        </>
      ) : (
        <div className="card mt-6 p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-river-soft text-river-ink" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <h3 className="mt-4 font-display text-2xl uppercase">No encontramos notas</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
            Probá con otra categoría o buscá un término distinto. También podés volver al feed completo.
          </p>
          <button type="button" onClick={resetFilters} className="btn btn-primary mt-5">
            Ver todas las novedades
          </button>
        </div>
      )}
    </div>
  );
}
