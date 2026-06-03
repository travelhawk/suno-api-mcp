# suno-api-mcp — Codex Agent Guide

## Project overview

TypeScript MCP server that wraps the **sunoapi.org** REST API to expose Suno AI music generation as semantic tools. Pure HTTP — no browser automation, no Playwright.

- **Base API:** `https://api.sunoapi.org/api/v1`
- **Auth:** `SUNOAPI_KEY` env var → `Authorization: Bearer <key>` header on every request
- **Transport:** STDIO (MCP JSON-RPC)
- **Runtime:** Node.js ≥ 22, built to `dist/server.cjs` via esbuild

## Repository layout

```
src/
  server.ts            # Entry point — creates McpServer, registers all tools, connects STDIO transport
  tools/               # One file per semantic tool; each exports a single async function
    compose-song.ts    # compose_song — POST /generate → poll until SUCCESS
    write-lyrics.ts    # write_lyrics — POST /lyrics → poll until SUCCESS
    extend-song.ts     # extend_song — POST /generate/extend → poll until SUCCESS
    separate-stems.ts  # separate_stems — POST /vocal-removal/generate → poll until SUCCESS
    create-persona.ts  # create_persona — POST /generate/generate-persona (synchronous)
    check-credits.ts   # check_credits — GET /generate/credit (synchronous)
  types/
    inputs.ts          # All Zod schemas + inferred TypeScript types (one per tool)
    suno.ts            # Best-effort types for sunoapi.org response shapes
  lib/
    client.ts          # sunoFetch(path, options) — adds auth header, throws on non-2xx
    poller.ts          # pollUntilDone(taskId, maxMs, intervalMs) — polls /generate/record-info
    logger.ts          # log(level, message, meta?) — writes ONLY to process.stderr
build.mjs              # esbuild bundle → dist/server.cjs (CJS, shebang, Node 22 target)
```

## Critical rules

1. **stdout is sacred.** The STDIO transport uses stdout exclusively for JSON-RPC. Never call `console.log` or write to stdout. All logging goes through `src/lib/logger.ts` which writes to `process.stderr`.

2. **Zod schemas are the contract.** Every tool input is defined in `src/types/inputs.ts` as a Zod schema. The MCP SDK derives the tool's JSON Schema from it automatically. Add the schema before the handler.

3. **Semantic tools only.** Tools represent meaningful creative actions (`compose_song`, not `call_generate_endpoint`). Each tool should be independently useful to a model without requiring the user to understand the underlying API.

4. **Async pattern.** The sunoapi.org API is async — generation endpoints return a `taskId` immediately. All generation tools must call `pollUntilDone(taskId, timeoutMs)` to block until the result is ready before returning.

## Adding a new tool

1. Add Zod schema + exported type to `src/types/inputs.ts`
2. Create `src/tools/<name>.ts` — export one `async function` that calls `sunoFetch` and returns a plain object
3. Register in `src/server.ts` with a `server.tool(name, description, Schema.shape, handler)` call
4. Update the tool table in `README.md`

## Commands

```bash
npm install       # install deps + build (runs prepare → build.mjs)
npm run build     # compile with esbuild → dist/server.cjs
npm run dev       # run source directly via tsx (no compile step, reads .env)
npm run typecheck # tsc --noEmit (no output, type errors only)
```

## Environment

| Variable | Required | Description |
|---|---|---|
| `SUNOAPI_KEY` | Yes | Bearer token from sunoapi.org dashboard |

Copy `.env.example` → `.env` for local dev. Pass via `env` block in MCP client config for production use.

## Excluded endpoints

The following sunoapi.org endpoints are intentionally not exposed as MCP tools (too niche or require complex prerequisite chains):

- `/mp4/generate` — music video generation
- `/midi/generate` — MIDI extraction (requires prior stem separation)
- `/generate/mashup` — mashup of two audio files
- `/generate/add-instrumental` — add instrumental to an uploaded file
- `/style/generate` — style text boost
