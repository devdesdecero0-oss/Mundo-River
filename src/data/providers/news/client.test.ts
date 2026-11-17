import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { NewsFeedClient, NewsProviderError } from "./client";

const fixturePath = fileURLToPath(
  new URL("./__fixtures__/google-news.xml", import.meta.url),
);
const xml = readFileSync(fixturePath, "utf8");

function rssResponse(body: string, status = 200): Response {
  return new Response(body, { status, headers: { "Content-Type": "application/rss+xml" } });
}

describe("NewsFeedClient", () => {
  it("parsea el feed, filtra y cachea el resultado", async () => {
    const fetchImpl = vi.fn(async () => rssResponse(xml));
    const client = new NewsFeedClient({
      feeds: ["https://news.test/rss"],
      fetchImpl,
    });

    const first = await client.listArticles();
    const second = await client.listArticles();

    expect(first.length).toBeGreaterThan(8);
    expect(second).toBe(first);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://news.test/rss");
    expect((init.headers as Record<string, string>)["User-Agent"]).toContain("MundoRiver");
  });

  it("tolera un feed caído si otro responde", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(rssResponse(xml));
    const client = new NewsFeedClient({
      feeds: ["https://news.test/caido", "https://news.test/ok"],
      fetchImpl,
    });

    await expect(client.listArticles()).resolves.toHaveLength(12);
  });

  it("falla si ningún feed devuelve noticias", async () => {
    const fetchImpl = vi.fn(async () => rssResponse("", 500));
    const client = new NewsFeedClient({
      feeds: ["https://news.test/rss"],
      fetchImpl,
    });
    await expect(client.listArticles()).rejects.toBeInstanceOf(NewsProviderError);
  });

  it("falla sin feeds configurados", async () => {
    const client = new NewsFeedClient({ feeds: [], fetchImpl: vi.fn() });
    await expect(client.listArticles()).rejects.toBeInstanceOf(NewsProviderError);
  });

  it("deduplica llamadas simultáneas", async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    const fetchImpl = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const client = new NewsFeedClient({
      feeds: ["https://news.test/rss"],
      fetchImpl,
    });

    const first = client.listArticles();
    const second = client.listArticles();
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    resolveFetch?.(rssResponse(xml));
    const [a, b] = await Promise.all([first, second]);
    expect(a).toBe(b);
  });
});
