import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { BzzoiroClient, BzzoiroError } from "./client";

const schema = z.object({ ok: z.boolean() });

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("BzzoiroClient", () => {
  it("envía el token en el header y valida la respuesta", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ ok: true }));
    const client = new BzzoiroClient({ token: " secreto ", fetchImpl, retries: 0 });

    await expect(client.get("events/", schema)).resolves.toEqual({ ok: true });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://sports.bzzoiro.com/api/v2/events/");
    expect((init.headers as Record<string, string>).Authorization).toBe("Token secreto");
  });

  it("reintenta solo errores 5xx y termina cuando el proveedor responde", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: true }, 503))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const client = new BzzoiroClient({
      token: "t",
      fetchImpl,
      retries: 1,
      retryDelayMs: 0,
    });

    await expect(client.get("events/", schema)).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("no reintenta errores 4xx", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: true }, 401));
    const client = new BzzoiroClient({ token: "t", fetchImpl, retries: 2, retryDelayMs: 0 });

    await expect(client.get("events/", schema)).rejects.toMatchObject({ status: 401 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("devuelve null en 404 cuando allowNotFound está activo", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ detail: "Not found" }, 404));
    const client = new BzzoiroClient({ token: "t", fetchImpl, retries: 0 });

    await expect(client.get("events/999/", schema, { allowNotFound: true })).resolves.toBeNull();
  });

  it("rechaza payloads que no cumplen el contrato", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ ok: "no" }));
    const client = new BzzoiroClient({ token: "t", fetchImpl, retries: 0 });

    await expect(client.get("events/", schema)).rejects.toBeInstanceOf(BzzoiroError);
  });

  it("no expone el token en los mensajes de error", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: true }, 500));
    const client = new BzzoiroClient({
      token: "token-super-secreto",
      fetchImpl,
      retries: 0,
    });

    const error = await client.get("events/", schema).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(BzzoiroError);
    expect(String(error)).not.toContain("token-super-secreto");
  });

  it("deduplica llamadas simultáneas idénticas", async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    const fetchImpl = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const client = new BzzoiroClient({ token: "t", fetchImpl, retries: 0 });

    const first = client.get("events/", schema);
    const second = client.get("events/", schema);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    resolveFetch?.(jsonResponse({ ok: true }));
    await expect(Promise.all([first, second])).resolves.toEqual([{ ok: true }, { ok: true }]);
  });

  it("exige un token al construirse", () => {
    expect(() => new BzzoiroClient({ token: "  " })).toThrow(BzzoiroError);
  });
});
