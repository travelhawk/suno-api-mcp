import { sunoFetch, CALLBACK_URL } from "../lib/client.js";
import { log } from "../lib/logger.js";
import { pollUntilDone } from "../lib/poller.js";
import { downloadSongs } from "../lib/download.js";
import type { ComposeSongInput } from "../types/inputs.js";
import type { SunoResponse, GenerateTaskResponse, SongRecord } from "../types/suno.js";

export interface ComposeSongResult {
  task_id: string;
  songs: Array<{
    id: string;
    title: string;
    audio_url: string;
    stream_audio_url: string;
    image_url: string;
    duration: number;
    tags: string;
    model: string;
    file_path?: string;
  }>;
}

export async function composeSong(input: ComposeSongInput): Promise<ComposeSongResult> {
  const useCustomMode = !!(input.style || input.title);

  const body: Record<string, unknown> = {
    prompt: input.description,
    model: input.model,
    customMode: useCustomMode,
    instrumental: input.instrumental,
    callBackUrl: CALLBACK_URL,
  };

  if (useCustomMode) {
    if (input.style) body.style = input.style;
    if (input.title) body.title = input.title;
  }

  if (input.persona_id) {
    body.personaId = input.persona_id;
    body.personaModel = input.persona_model;
  }

  log("info", "starting song generation", {
    customMode: useCustomMode,
    model: input.model,
    instrumental: input.instrumental,
    hasPersona: !!input.persona_id,
  });

  const createRes = (await sunoFetch("/generate", {
    method: "POST",
    body: JSON.stringify(body),
  })) as SunoResponse<GenerateTaskResponse>;

  const taskId = createRes.data.taskId;
  log("info", `song task started`, { taskId });

  const record = await pollUntilDone(taskId, input.poll_timeout_ms);
  const songs: SongRecord[] = record.response?.sunoData ?? [];

  const mapped = songs.map((s) => ({
    id: s.id,
    title: s.title,
    audio_url: s.audioUrl,
    stream_audio_url: s.streamAudioUrl,
    image_url: s.imageUrl,
    duration: s.duration,
    tags: s.tags,
    model: s.modelName,
    file_path: undefined as string | undefined,
  }));

  if (input.download && mapped.length > 0) {
    log("info", "downloading songs", { dir: input.download_dir, count: mapped.length });
    const paths = await downloadSongs(mapped, input.download_dir);
    for (const song of mapped) {
      song.file_path = paths.get(song.id);
    }
  }

  return { task_id: taskId, songs: mapped };
}
