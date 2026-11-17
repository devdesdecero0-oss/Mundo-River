import { describe, expect, it } from "vitest";
import {
  categoryFromSlug,
  categoryLabel,
  categorySlug,
  computeReadingTime,
  countNewsByCategory,
  filterNews,
  getRelatedArticles,
  NEWS_CATEGORIES,
  normalizeSearchText,
  paginate,
  sortNews,
} from "@/domain/news";
import { makeArticle } from "@/test-utils/domain";

describe("R-NEWS — tiempo de lectura", () => {
  it("devuelve 1 minuto para cuerpos vacíos (caso borde 12)", () => {
    expect(computeReadingTime([])).toBe(1);
    expect(computeReadingTime("")).toBe(1);
    expect(computeReadingTime([{ type: "image", src: "/foto.jpg" }])).toBe(1);
  });

  it("cuenta palabras y excluye imágenes", () => {
    expect(computeReadingTime(Array.from({ length: 200 }, () => "gol").join(" "))).toBe(1);
    expect(computeReadingTime(Array.from({ length: 201 }, () => "gol").join(" "))).toBe(2);
    expect(
      computeReadingTime([
        { type: "paragraph", text: "palabra ".repeat(200) },
        { type: "image", src: "/x.jpg", text: "no contar" },
      ]),
    ).toBe(1);
  });

  it("ignora etiquetas HTML del texto", () => {
    expect(computeReadingTime("<p>River <strong>goleó</strong></p>")).toBe(1);
  });
});

describe("R-NEWS — filtros y búsqueda", () => {
  const articles = [
    makeArticle({ id: "n1", category: "plantel-profesional", title: "Driussi marca diferencias", tags: ["goleador"] }),
    makeArticle({ id: "n2", category: "inferiores", title: "La Reserva goleó", tags: ["cantera"] }),
    makeArticle({ id: "n3", category: "institucional", title: "Nuevo museo en el Monumental", tags: ["obra"] }),
    makeArticle({ id: "n4", category: "mercado-de-pases", title: "Llegó un refuerzo", tags: ["fichaje"] }),
  ];

  it("filtra por categoría", () => {
    expect(filterNews(articles, { category: "inferiores" }).map((article) => article.id)).toEqual([
      "n2",
    ]);
    expect(filterNews(articles, { category: "all" })).toHaveLength(4);
  });

  it("busca sin distinguir mayúsculas ni acentos", () => {
    expect(normalizeSearchText("Monumental ÁÉÍÓÚ")).toBe("monumental aeiou");
    expect(filterNews(articles, { query: "GÓLEÓ" }).map((article) => article.id)).toEqual(["n2"]);
    expect(filterNews(articles, { query: "driussi" }).map((article) => article.id)).toEqual(["n1"]);
    expect(filterNews(articles, { query: "cantera" }).map((article) => article.id)).toEqual(["n2"]);
  });

  it("devuelve vacío cuando no hay coincidencias (FR-019)", () => {
    expect(filterNews(articles, { query: "inexistente" })).toEqual([]);
    expect(filterNews(articles, { category: "inferiores", query: "driussi" })).toEqual([]);
  });
});

describe("R-NEWS — orden, paginación y conteos", () => {
  const articles = [
    makeArticle({ id: "a", publishedAt: "2026-03-01T12:00:00Z" }),
    makeArticle({ id: "b", publishedAt: "2026-03-03T12:00:00Z" }),
    makeArticle({ id: "c", publishedAt: "2026-03-02T12:00:00Z" }),
    makeArticle({ id: "d", publishedAt: "2026-03-03T12:00:00Z" }),
  ];

  it("ordena por fecha descendente con desempate por id", () => {
    expect(sortNews(articles).map((article) => article.id)).toEqual(["b", "d", "c", "a"]);
    expect(articles.map((article) => article.id)).toEqual(["a", "b", "c", "d"]); // no muta
  });

  it("pagina sin duplicados (caso borde 13)", () => {
    const first = paginate(articles, 1, 2);
    const second = paginate(articles, 2, 2);
    const ids = [...first.items, ...second.items].map((article) => article.id);
    expect(ids).toEqual(["a", "b", "c", "d"]);
    expect(new Set(ids).size).toBe(4);
    expect(first.hasMore).toBe(true);
    expect(second.hasMore).toBe(false);
  });

  it("normaliza páginas inválidas", () => {
    expect(paginate(articles, 0, 0)).toMatchObject({ page: 1, pageSize: 1, hasMore: true });
    const beyond = paginate(articles, 10, 9);
    expect(beyond.items).toEqual([]);
    expect(beyond.hasMore).toBe(false);
  });

  it("cuenta artículos por categoría", () => {
    const mixed = [
      ...articles,
      makeArticle({ id: "e", category: "inferiores" }),
      makeArticle({ id: "f", category: "inferiores" }),
    ];
    expect(countNewsByCategory(mixed)).toMatchObject({
      all: 6,
      "plantel-profesional": 4,
      inferiores: 2,
      institucional: 0,
      "mercado-de-pases": 0,
    });
  });

  it("sugiere relacionadas por categoría y etiquetas", () => {
    const current = makeArticle({
      id: "current",
      category: "plantel-profesional",
      tags: ["driussi", "gol"],
      publishedAt: "2026-03-05T12:00:00Z",
    });
    const pool = [
      current,
      makeArticle({ id: "same-cat", category: "plantel-profesional", publishedAt: "2026-03-01T12:00:00Z" }),
      makeArticle({ id: "shared-tag", category: "inferiores", tags: ["driussi"], publishedAt: "2026-03-02T12:00:00Z" }),
      makeArticle({ id: "unrelated", category: "institucional", tags: ["museo"], publishedAt: "2026-03-03T12:00:00Z" }),
    ];
    expect(getRelatedArticles(pool, current).map((article) => article.id)).toEqual([
      "same-cat",
      "shared-tag",
    ]);
  });
});

describe("catálogo de categorías", () => {
  it("mapea id, slug y etiqueta", () => {
    expect(NEWS_CATEGORIES).toHaveLength(4);
    expect(categoryLabel("mercado-de-pases")).toBe("Mercado de Pases");
    expect(categorySlug("inferiores")).toBe("inferiores");
    expect(categoryFromSlug("plantel-profesional")).toBe("plantel-profesional");
    expect(categoryFromSlug("otra")).toBe("all");
    expect(categoryFromSlug(null)).toBe("all");
  });
});
