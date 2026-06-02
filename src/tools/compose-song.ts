import { sunoFetch } from "../lib/client.js";
import { log } from "../lib/logger.js";
import { pollUntilDone } from "../lib/poller.js";
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
  }>;
}

export async function composeSong(input: ComposeSongInput): Promise<ComposeSongResult> {
  const useCustomMode = !!(input.style || input.title);

  const body: Record<string, unknown> = {
    prompt: input.description,
    model: input.model,
    customMode: useCustomMode,
    instrumental: input.instrumental,
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
  const songs: SongRecord[] = record.response?.data ?? [];

  return {
    task_id: taskId,
    songs: songs.map((s) => ({
      id: s.id,
      title: s.title,
      audio_url: s.audio_url,
      stream_audio_url: s.stream_audio_url,
      image_url: s.image_url,
      duration: s.duration,
      tags: s.tags,
      model: s.model_name,
    })),
  };
}
