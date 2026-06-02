import { log } from "./logger.js";

const BASE_URL = "https://api.sunoapi.org/api/v1";

export class SunoApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "SunoApiError";
  }
}

export async function sunoFetch(
  path: string,
  options?: RequestInit,
): Promise<unknown> {
  const key = process.env.SUNOAPI_KEY;
  if (!key) {
    throw new Error(
      "SUNOAPI_KEY environment variable is not set. " +
        "Get your key at https://sunoapi.org and pass it via env.",
    );
  }

  const url = `${BASE_URL}${path}`;
  log("debug", `→ ${options?.method ?? "GET"} ${url}`);

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  const text = await res.text();

  if (!res.ok) {
    log("error", `sunoapi.org ${res.status}`, { path, body: text.slice(0, 300) });
    throw new SunoApiError(
      res.status,
      `sunoapi.org returned ${res.status}: ${text.slice(0, 200)}`,
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
