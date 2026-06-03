# suno-api-mcp — Claude Code Guide

## Project overview

TypeScript MCP server wrapping the **sunoapi.org** REST API. Exposes Suno AI music generation as 8 semantic MCP tools. Pure HTTP — no browser automation.

- **Base API:** `https://api.sunoapi.org/api/v1`
- **Auth:** `SUNOAPI_KEY` env var → `Authorization: Bearer <key>`
- **Transport:** STDIO (MCP JSON-RPC)
- **Runtime:** Node.js ≥ 22 → compiled to `dist/server.cjs` via esbuild

## Layout

```
src/server.ts          # McpServer entry, registers all tools, STDIO transport
src/tools/             # One file per tool, one exported async function each
src/types/inputs.ts    # All Zod schemas — the single source of truth for tool contracts
src/types/suno.ts      # sunoapi.org response types (best-effort)
src/lib/client.ts      # sunoFetch() — Bearer auth, throws on non-2xx
src/lib/poller.ts      # pollUntilDone() — polls /generate/record-info until SUCCESS/FAILED
src/lib/logger.ts      # log() — stderr ONLY, never stdout
build.mjs              # esbuild → dist/server.cjs (CJS bundle, shebang)
```

## Hard rules

- **Never write to stdout.** Use `log()` from `src/lib/logger.ts`. The STDIO transport owns stdout for JSON-RPC.
- **Schema first.** Define the Zod schema in `src/types/inputs.ts` before writing any handler.
- **All generation tools must poll.** `sunoFetch("/generate", ...)` returns a `taskId`. Always call `pollUntilDone(taskId)` before returning.

## Dev commands

```bash
npm run dev        # tsx src/server.ts (reads .env, no compile needed)
npm run build      # esbuild → dist/server.cjs
npm run typecheck  # tsc --noEmit
```

## Adding a tool

1. Add Zod schema + type to `src/types/inputs.ts`
2. Create `src/tools/<name>.ts` with one exported async function
3. Register in `src/server.ts` via `server.tool(name, description, Schema.shape, handler)`
4. Add a row to the tool table in `README.md`
