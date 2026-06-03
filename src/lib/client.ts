import { log } from "./logger.js";

const BASE_URL = "https://api.sunoapi.org/api/v1";

/**
 * sunoapi.org requires a `callBackUrl` on every generation request, even when
 * the result is retrieved by polling instead of webhooks. We never receive a
 * callback — we poll record-info — so any reachable URL satisfies the API.
 * Override with SUNOAPI_CALLBACK_URL if you do want to run a webhook receiver.
 */
export const CALLBACK_URL =
  process.env.SUNOAPI_CALLBACK_URL ?? "https://example.com/suno-callback";

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

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return text;
  }

  // sunoapi.org returns 200 with { code, msg, data: null } on API-level errors
  if (
    parsed !== null &&
    typeof parsed === "object" &&
    "data" in parsed &&
    (parsed as Record<string, unknown>).data === null &&
    "msg" in parsed
  ) {
    const msg = (parsed as Record<string, unknown>).msg;
    const code = (parsed as Record<string, unknown>).code;
    log("error", `sunoapi.org API error`, { path, code, msg });
    throw new SunoApiError(
      typeof code === "number" ? code : 400,
      `sunoapi.org error: ${msg}`,
    );
  }

  return parsed;
}
