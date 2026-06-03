import { sunoFetch, CALLBACK_URL } from "../lib/client.js";
import { log } from "../lib/logger.js";
import { pollUntilDone } from "../lib/poller.js";
import type { ExtendSongInput } from "../types/inputs.js";
import type { SunoResponse, GenerateTaskResponse, SongRecord } from "../types/suno.js";
import type { ComposeSongResult } from "./compose-song.js";

export async function extendSong(input: ExtendSongInput): Promise<ComposeSongResult> {
  const useCustomMode = !!(input.description || input.style || input.title);

  const body: Record<string, unknown> = {
    audioId: input.audio_id,
    model: input.model,
    defaultParamFlag: useCustomMode,
    callBackUrl: CALLBACK_URL,
  };

  if (useCustomMode) {
    body.continueAt = input.continue_at;
    if (input.description) body.prompt = input.description;
    if (input.style) body.style = input.style;
    if (input.title) body.title = input.title;
  }

  log("info", "extending song", {
    audioId: input.audio_id,
    continueAt: input.continue_at,
    customMode: useCustomMode,
  });

  const createRes = (await sunoFetch("/generate/extend", {
    method: "POST",
    body: JSON.stringify(body),
  })) as SunoResponse<GenerateTaskResponse>;

  const taskId = createRes.data.taskId;
  log("info", `extend task started`, { taskId });

  const record = await pollUntilDone(taskId, input.poll_timeout_ms);
  const songs: SongRecord[] = record.response?.sunoData ?? [];

  return {
    task_id: taskId,
    songs: songs.map((s) => ({
      id: s.id,
      title: s.title,
      audio_url: s.audioUrl,
      stream_audio_url: s.streamAudioUrl,
      image_url: s.imageUrl,
      duration: s.duration,
      tags: s.tags,
      model: s.modelName,
    })),
  };
}
