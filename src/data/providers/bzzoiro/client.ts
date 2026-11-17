import type { ZodType } from "zod";

/**
 * Cliente HTTP server-side de Bzzoiro Sports Data v2.
 *
 * - Autenticación por token en el header `Authorization`.
 * - Timeout por request y reintentos solo ante 5xx o fallas de red.
 * - Single-flight en memoria para evitar ráfagas idénticas.
 * - El token nunca se incluye en mensajes de error.
 */

const DEFAULT_BASE_URL = "https://sports.bzzoiro.com/api/v2";
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_RETRIES = 2;

export interface BzzoiroClientOptions {
  token: string;
  baseUrl?: string;
  timeoutMs?: number;
  retries?: number;
  fetchImpl?: typeof fetch;
  retryDelayMs?: number;
}

export interface BzzoiroRequestOptions {
  revalidate?: number;
  tags?: string[];
  /** Si es `true`, un 404 devuelve `null` en lugar de lanzar. */
  allowNotFound?: boolean;
}

export class BzzoiroError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "BzzoiroError";
    this.status = status;
  }
}

export class BzzoiroClient {
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly fetchImpl: typeof fetch;
  private readonly retryDelayMs: number;
  private readonly inflight = new Map<string, Promise<unknown>>();

  constructor(options: BzzoiroClientOptions) {
    if (!options.token.trim()) {
      throw new BzzoiroError("Falta BZZOIRO_TOKEN para consultar el proveedor.");
    }
    this.token = options.token.trim();
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.retries = Math.max(0, options.retries ?? DEFAULT_RETRIES);
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.retryDelayMs = options.retryDelayMs ?? 250;
  }

  async get<T>(
    path: string,
    schema: ZodType<T>,
    options: BzzoiroRequestOptions = {},
  ): Promise<T> {
    const key = `${options.allowNotFound ? "optional:" : ""}${path}`;
    const cached = this.inflight.get(key);
    if (cached) return cached as Promise<T>;

    const request = this.execute(path, schema, options).finally(() => {
      this.inflight.delete(key);
    });

    this.inflight.set(key, request);
    return request;
  }

  private async execute<T>(
    path: string,
    schema: ZodType<T>,
    options: BzzoiroRequestOptions,
  ): Promise<T> {
    const url = `${this.baseUrl}/${path.replace(/^\/+/, "")}`;
    let lastError: BzzoiroError | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      try {
        return await this.requestOnce(url, schema, options);
      } catch (error) {
        const providerError =
          error instanceof BzzoiroError
            ? error
            : new BzzoiroError("No se pudo consultar el proveedor de datos.");

        const retryable =
          providerError.status === null || providerError.status >= 500;
        if (!retryable || attempt === this.retries) throw providerError;

        lastError = providerError;
        if (this.retryDelayMs > 0) {
          await delay(this.retryDelayMs * 2 ** attempt);
        }
      }
    }

    throw lastError ?? new BzzoiroError("No se pudo consultar el proveedor de datos.");
  }

  private async requestOnce<T>(
    url: string,
    schema: ZodType<T>,
    options: BzzoiroRequestOptions,
  ): Promise<T> {
    const init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
      headers: {
        Authorization: `Token ${this.token}`,
        Accept: "application/json",
        "User-Agent": "MundoRiver/0.1",
      },
      signal: AbortSignal.timeout(this.timeoutMs),
      ...(options.revalidate !== undefined || options.tags
        ? {
            next: {
              ...(options.revalidate !== undefined ? { revalidate: options.revalidate } : {}),
              ...(options.tags ? { tags: options.tags } : {}),
            },
          }
        : {}),
    };

    let response: Response;
    try {
      response = await this.fetchImpl(url, init);
    } catch {
      throw new BzzoiroError("El proveedor de datos no respondió.");
    }

    if (response.status === 404 && options.allowNotFound) {
      return null as T;
    }

    if (!response.ok) {
      throw new BzzoiroError(
        `El proveedor respondió con estado ${response.status}.`,
        response.status,
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new BzzoiroError("El proveedor devolvió una respuesta que no es JSON.");
    }

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      throw new BzzoiroError("El proveedor devolvió un payload con un contrato inesperado.");
    }

    return parsed.data;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
