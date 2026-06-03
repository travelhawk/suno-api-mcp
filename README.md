# suno-api-mcp

A production-grade **Model Context Protocol (MCP) server** for AI music generation via [sunoapi.org](https://sunoapi.org). Connect any MCP-compatible AI assistant (Claude, Cursor, etc.) to Suno and generate, extend, and dissect music through natural language.

## Tools

| Tool | What it does |
|---|---|
| `compose_song` | Generate an original song from a description — blocks until audio is ready |
| `write_lyrics` | Write structured verse/chorus lyrics for a theme |
| `extend_song` | Branch an existing song at a timestamp and continue it |
| `separate_stems` | Extract vocal and/or instrument stems from a generated track |
| `create_persona` | Capture a voice/style from a track as a reusable persona |
| `check_credits` | Check remaining sunoapi.org credits |

## Prerequisites

- **Node.js ≥ 22**
- A [sunoapi.org](https://sunoapi.org) account and API key

## Installation

### Claude Desktop (recommended)

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "suno": {
      "command": "npx",
      "args": ["-y", "github:travelhawk/suno-api-mcp"],
      "env": {
        "SUNOAPI_KEY": "your_api_key_here"
      }
    }
  }
}
```

`npx` will download, build, and run the server automatically on first use.

### Local development

```bash
git clone https://github.com/travelhawk/suno-api-mcp.git
cd suno-api-mcp
npm install          # also runs the esbuild compile step
cp .env.example .env # then fill in your key
npm run dev          # run with tsx (no compile step)
```

## Configuration

| Variable | Required | Description |
|---|---|---|
| `SUNOAPI_KEY` | ✅ | Bearer token from your sunoapi.org dashboard |

Copy `.env.example` to `.env` and set your key. When running via Claude Desktop, pass `SUNOAPI_KEY` in the `env` block instead.

## Usage examples

> **Generate a song**
> "Compose a melancholic lo-fi hip hop track about missing someone on a rainy night. No vocals."

> **Write lyrics first, then produce**
> "Write me lyrics about chasing dreams at 3am, then compose a dreamy synth-pop song using them."

> **Extend a track**
> "That song was great but too short — extend it from the 45-second mark with a guitar solo."

> **Stem separation**
> "Extract just the vocals from the track with audio ID `abc123`."

> **Persona workflow**
> "Create a persona from that warm baritone voice in track `xyz`, then use it to sing a jazz standard."

## Workflow chaining

```
compose_song  ──► extend_song       (make it longer)
              ──► separate_stems    (isolate instruments)
              ──► create_persona    (clone the voice/style)
                       │
                       └──► compose_song(persona_id=…)  (reuse it)

write_lyrics  ──► compose_song(description includes lyrics)
```

## Credit costs (approximate)

| Operation | Credits |
|---|---|
| Song generation | varies by model |
| Stem separation — vocals only | 10 |
| Stem separation — full 12-stem | 50 |
| Lyrics generation | low |
| Persona creation | varies |

Use `check_credits` before expensive operations.

## Development

```bash
npm run build      # compile with esbuild → dist/server.cjs
npm run dev        # run source directly with tsx (no compile needed)
npm run typecheck  # type-check without emitting
```

## Project structure

```
src/
  server.ts          # MCP server entry — registers all tools, STDIO transport
  tools/             # one file per semantic tool
  types/
    inputs.ts        # Zod schemas for every tool input
    suno.ts          # API response types
  lib/
    client.ts        # sunoFetch() — Bearer auth, error handling
    poller.ts        # pollUntilDone() — task status polling loop
    logger.ts        # stderr-only structured logging
build.mjs            # esbuild bundle script
```

## License

[MIT](LICENSE)
