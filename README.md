# suno-api-mcp

A production-grade **Model Context Protocol (MCP) server** for AI music generation via [sunoapi.org](https://sunoapi.org). Connect any MCP-compatible AI assistant (Claude, Cursor, etc.) to Suno and generate, extend, and dissect music through natural language.

## Tools

| Tool | What it does |
|---|---|
| `compose_song` | Generate an original song from a description — blocks until audio is ready (can auto-download as titled `.mp3`) |
| `write_lyrics` | Write structured verse/chorus lyrics for a theme |
| `extend_song` | Branch an existing song at a timestamp and continue it |
| `separate_stems` | Extract vocal and/or instrument stems from a generated track |
| `create_persona` | Capture a voice/style from a track as a reusable persona |
| `convert_to_wav` | Convert a generated song to lossless WAV (can auto-download) |
| `create_music_video` | Render an MP4 music video for a generated song (can auto-download) |
| `check_credits` | Check remaining sunoapi.org credits |

## Prerequisites

- **Node.js ≥ 22**
- A [sunoapi.org](https://sunoapi.org) account and API key

## Installation

### Claude Code (one-liner)

```bash
claude mcp add sunoapi -e SUNOAPI_KEY=your_api_key_here -- npx -y github:travelhawk/suno-api-mcp
```

### OpenAI Codex CLI (one-liner)

```bash
codex mcp add sunoapi --env SUNOAPI_KEY=your_api_key_here -- npx -y github:travelhawk/suno-api-mcp
```

### Claude Desktop

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
| `SUNOAPI_CALLBACK_URL` | — | Optional. sunoapi.org requires a callback URL on every generation request; the server polls for results instead, so a placeholder is sent by default. Set this only if you run your own webhook receiver. |

Copy `.env.example` to `.env` and set your key. When running via Claude Desktop, pass `SUNOAPI_KEY` in the `env` block instead.

## Usage examples

> **Generate a song**
> "Compose a melancholic lo-fi hip hop track about missing someone on a rainy night. No vocals."

> **Write lyrics first, then produce**
> "Write me lyrics about chasing dreams at 3am, then compose a dreamy synth-pop song using them."

> **Generate and save to disk**
> "Compose a deep house track about deep focus at 120 BPM and download it to ./songs."

> **Extend a track**
> "That song was great but too short — extend it from the 45-second mark with a guitar solo."

> **Lossless WAV**
> "Convert that song to WAV and save it to ./songs."

> **Music video**
> "Make a music video for that track and download the MP4 to ./songs."

> **Stem separation**
> "Extract just the vocals from the track with audio ID `abc123`."

> **Persona workflow**
> "Create a persona from that warm baritone voice in track `xyz`, then use it to sing a jazz standard."

## Downloading songs

`compose_song` and `extend_song` accept two optional parameters:

| Parameter | Default | Description |
|---|---|---|
| `download` | `false` | When `true`, each finished song is saved to local disk as an `.mp3`. |
| `download_dir` | `./songs` | Directory the files are written to (created if missing). |

Each file is **named after the song's title** (e.g. `Deep Focus.mp3`) and has its
ID3 tags written (title, artist `Suno`, and the style as genre), so media players
show the proper name instead of an opaque URL hash. Titles are sanitized for the
filesystem and de-duplicated (`Title (2).mp3`) when a batch shares a title. The
saved path is returned in each song's `file_path` field.

`convert_to_wav` and `create_music_video` accept the same `download` /
`download_dir` options and save `<title>.wav` / `<title>.mp4` respectively (named
after the original song's title, looked up automatically; override with the
`title` parameter).

## Workflow chaining

```
compose_song  ──► extend_song       (make it longer)
              ──► separate_stems    (isolate instruments)
              ──► convert_to_wav    (lossless export)
              ──► create_music_video (render an MP4)
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

## AI agent configuration

The repo ships configuration files for AI coding assistants:

| File | Agent | Purpose |
|---|---|---|
| `CLAUDE.md` | [Claude Code](https://claude.ai/claude-code) | Project layout, hard rules, dev commands |
| `AGENTS.md` | [OpenAI Codex CLI](https://github.com/openai/codex) | Full layout, stdout/stderr rule, Zod-first pattern, async polling requirement, add-tool steps |

Both files encode the same three invariants every agent must respect:
1. **Never write to stdout** — the STDIO transport owns it for JSON-RPC
2. **Schema before handler** — define the Zod schema in `src/types/inputs.ts` first
3. **Always poll** — generation endpoints return a `taskId`; call `pollUntilDone()` before returning

## License

[MIT](LICENSE)
