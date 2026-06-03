import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { log } from "./lib/logger.js";

import {
  ComposeSongInput,
  WriteLyricsInput,
  ExtendSongInput,
  SeparateStemsInput,
  CreatePersonaInput,
  ConvertToWavInput,
  CreateMusicVideoInput,
  CheckCreditsInput,
} from "./types/inputs.js";

import { composeSong } from "./tools/compose-song.js";
import { writeLyrics } from "./tools/write-lyrics.js";
import { extendSong } from "./tools/extend-song.js";
import { separateStems } from "./tools/separate-stems.js";
import { createPersona } from "./tools/create-persona.js";
import { convertToWav } from "./tools/convert-to-wav.js";
import { createMusicVideo } from "./tools/create-music-video.js";
import { checkCredits } from "./tools/check-credits.js";

const server = new McpServer({
  name: "suno-api-mcp",
  version: "1.0.0",
});

// ── compose_song ─────────────────────────────────────────────────────────────

server.tool(
  "compose_song",
  "Generate an original song from a creative description. The tool submits the request " +
    "to Suno via sunoapi.org and waits until the audio is ready (typically 2–5 minutes). " +
    "Returns direct audio URLs you can play or share immediately. " +
    "Optionally apply a persona (voice/style clone) created with create_persona.",
  ComposeSongInput.shape,
  async (input) => {
    try {
      const result = await composeSong(input as typeof ComposeSongInput._type);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  },
);

// ── write_lyrics ──────────────────────────────────────────────────────────────

server.tool(
  "write_lyrics",
  "Generate structured song lyrics for a given theme or topic. " +
    "Returns lyrics organized into verses and choruses with section markers like [Verse] and [Chorus]. " +
    "The lyrics can be used as-is or passed into compose_song as part of the description.",
  WriteLyricsInput.shape,
  async (input) => {
    try {
      const result = await writeLyrics(input as typeof WriteLyricsInput._type);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  },
);

// ── extend_song ───────────────────────────────────────────────────────────────

server.tool(
  "extend_song",
  "Extend an existing Suno-generated song by branching from a specific timestamp. " +
    "Useful for making a short clip longer or generating an alternative ending. " +
    "Requires the task_id and audio_id from a previous compose_song call.",
  ExtendSongInput.shape,
  async (input) => {
    try {
      const result = await extendSong(input as typeof ExtendSongInput._type);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  },
);

// ── separate_stems ────────────────────────────────────────────────────────────

server.tool(
  "separate_stems",
  "Extract individual audio stems from a generated song. " +
    "'vocals_only' mode (10 credits) splits the track into a vocal stem and an instrumental stem. " +
    "'full_stems' mode (50 credits) isolates up to 12 individual instruments " +
    "(drums, bass, guitar, keyboards, strings, brass, woodwinds, percussion, synth, FX, vocals, backing vocals). " +
    "Returns URLs to each stem file.",
  SeparateStemsInput.shape,
  async (input) => {
    try {
      const result = await separateStems(input as typeof SeparateStemsInput._type);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  },
);

// ── create_persona ────────────────────────────────────────────────────────────

server.tool(
  "create_persona",
  "Learn a voice or musical style from a generated song and save it as a reusable persona. " +
    "The persona captures the distinctive qualities of a 10–30 second segment of audio. " +
    "Once created, pass the returned persona_id to compose_song to apply that voice or style " +
    "to future songs. Each audio track can only produce one persona.",
  CreatePersonaInput.shape,
  async (input) => {
    try {
      const result = await createPersona(input as typeof CreatePersonaInput._type);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  },
);

// ── convert_to_wav ────────────────────────────────────────────────────────────

server.tool(
  "convert_to_wav",
  "Convert a previously generated song to lossless WAV format. " +
    "Requires the task_id and audio_id from a compose_song or extend_song result. " +
    "Returns a URL to the WAV file, and can optionally download it to disk named after the song title. " +
    "Useful for high-quality archival or further audio editing.",
  ConvertToWavInput.shape,
  async (input) => {
    try {
      const result = await convertToWav(input as typeof ConvertToWavInput._type);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  },
);

// ── create_music_video ────────────────────────────────────────────────────────

server.tool(
  "create_music_video",
  "Render a music video (MP4) for a previously generated song. " +
    "Requires the task_id and audio_id from a compose_song or extend_song result. " +
    "Optionally stamp an author name and a domain/brand watermark. " +
    "Returns a URL to the MP4, and can optionally download it to disk named after the song title.",
  CreateMusicVideoInput.shape,
  async (input) => {
    try {
      const result = await createMusicVideo(
        input as typeof CreateMusicVideoInput._type,
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  },
);

// ── check_credits ─────────────────────────────────────────────────────────────

server.tool(
  "check_credits",
  "Check the number of remaining API credits on your sunoapi.org account. " +
    "Call this before expensive operations to confirm you have enough credits. " +
    "Song generation costs vary by model; stem separation costs 10–50 credits.",
  CheckCreditsInput.shape,
  async () => {
    try {
      const result = await checkCredits();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  },
);

// ── start ─────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log("info", "suno-api-mcp server running on stdio");
}

main().catch((err) => {
  log("error", "fatal", { message: (err as Error).message });
  process.exit(1);
});
