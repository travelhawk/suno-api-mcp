import { z } from "zod";

const SunoModel = z.enum([
  "V4",
  "V4_5",
  "V4_5PLUS",
  "V4_5ALL",
  "V5",
  "V5_5",
]);

export const ComposeSongInput = z.object({
  description: z
    .string()
    .min(1)
    .max(3000)
    .describe(
      "Natural-language description of the song you want to create. Be creative and specific: include mood, genre, tempo, instrumentation, and lyrical themes.",
    ),
  style: z
    .string()
    .max(200)
    .optional()
    .describe(
      'Musical style tags, e.g. "lo-fi hip hop, rainy night, jazzy". Enables advanced mode when provided.',
    ),
  title: z
    .string()
    .max(80)
    .optional()
    .describe("Song title. Enables advanced mode when provided."),
  instrumental: z
    .boolean()
    .default(false)
    .describe("Set true to generate music without vocals."),
  model: SunoModel.default("V4_5").describe(
    "Suno model version. V4_5 is a good default; V5/V5_5 support longer prompts and richer styles.",
  ),
  persona_id: z
    .string()
    .optional()
    .describe(
      "ID of a previously created persona (voice or style). Obtain one with create_persona.",
    ),
  persona_model: z
    .enum(["style_persona", "voice_persona"])
    .default("style_persona")
    .describe("How to apply the persona: as a style influence or as a voice clone."),
  poll_timeout_ms: z
    .number()
    .int()
    .positive()
    .default(300_000)
    .describe("Max milliseconds to wait for generation to complete. Default 5 minutes."),
  download: z
    .boolean()
    .default(false)
    .describe(
      "When true, download each finished song to local disk as an .mp3 named after its title, " +
        "with ID3 title/artist tags embedded. The saved path is returned in each song's file_path.",
    ),
  download_dir: z
    .string()
    .default("./songs")
    .describe("Directory to save downloaded songs into when download is true. Default ./songs."),
});
export type ComposeSongInput = z.infer<typeof ComposeSongInput>;

export const WriteLyricsInput = z.object({
  theme: z
    .string()
    .min(1)
    .max(200)
    .describe(
      "Theme or topic for the lyrics, e.g. 'a breakup in autumn' or 'chasing dreams at 3am'.",
    ),
  poll_timeout_ms: z
    .number()
    .int()
    .positive()
    .default(120_000)
    .describe("Max milliseconds to wait. Default 2 minutes."),
});
export type WriteLyricsInput = z.infer<typeof WriteLyricsInput>;

export const ExtendSongInput = z.object({
  task_id: z
    .string()
    .min(1)
    .describe("The taskId returned by compose_song for the source track."),
  audio_id: z
    .string()
    .min(1)
    .describe("The specific song ID within that task (from the songs array)."),
  continue_at: z
    .number()
    .positive()
    .describe("Timestamp in seconds to branch from. Must be > 0 and < original duration."),
  description: z
    .string()
    .max(3000)
    .optional()
    .describe("Description of how you want the extension to continue."),
  style: z
    .string()
    .max(200)
    .optional()
    .describe("Style tags for the extended section."),
  title: z
    .string()
    .max(80)
    .optional()
    .describe("New title for the extended track."),
  model: SunoModel.default("V4_5"),
  poll_timeout_ms: z.number().int().positive().default(300_000),
  download: z
    .boolean()
    .default(false)
    .describe(
      "When true, download each finished song to local disk as a titled .mp3 with ID3 tags. " +
        "The saved path is returned in each song's file_path.",
    ),
  download_dir: z
    .string()
    .default("./songs")
    .describe("Directory to save downloaded songs into when download is true. Default ./songs."),
});
export type ExtendSongInput = z.infer<typeof ExtendSongInput>;

export const SeparateStemsInput = z.object({
  task_id: z
    .string()
    .min(1)
    .describe("The taskId from a completed compose_song call."),
  audio_id: z
    .string()
    .min(1)
    .describe("The specific song ID to separate."),
  mode: z
    .enum(["vocals_only", "full_stems"])
    .default("vocals_only")
    .describe(
      "vocals_only: separates into 2 tracks (vocal + instrumental), costs 10 credits. " +
        "full_stems: separates into 12 individual instrument tracks, costs 50 credits.",
    ),
  poll_timeout_ms: z.number().int().positive().default(180_000),
});
export type SeparateStemsInput = z.infer<typeof SeparateStemsInput>;

export const CreatePersonaInput = z.object({
  task_id: z
    .string()
    .min(1)
    .describe("The taskId from a completed compose_song call."),
  audio_id: z
    .string()
    .min(1)
    .describe("The specific song ID to learn from. Each audio_id can produce only one persona."),
  name: z
    .string()
    .min(1)
    .describe("A descriptive name for this persona, e.g. 'Warm Folk Baritone'."),
  description: z
    .string()
    .min(1)
    .describe(
      "Detailed description of the musical characteristics: voice texture, style, timbre, energy.",
    ),
  vocal_start: z
    .number()
    .min(0)
    .default(0)
    .describe("Start of the sample segment in seconds (default: 0)."),
  vocal_end: z
    .number()
    .min(10)
    .max(30)
    .default(30)
    .describe("End of the sample segment in seconds. The window must be 10–30 seconds."),
  style: z
    .string()
    .optional()
    .describe("Optional genre/category label for the persona."),
});
export type CreatePersonaInput = z.infer<typeof CreatePersonaInput>;

export const CheckCreditsInput = z.object({});
export type CheckCreditsInput = z.infer<typeof CheckCreditsInput>;
