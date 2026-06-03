import { sunoFetch, CALLBACK_URL } from "../lib/client.js";
import { log } from "../lib/logger.js";
import { downloadAudio } from "../lib/download.js";
import type { ConvertToWavInput } from "../types/inputs.js";
import type { SunoResponse, GenerateTaskResponse, SongRecord } from "../types/suno.js";

export interface ConvertToWavResult {
  task_id: string; // the WAV conversion task id
  audio_id: string;
  wav_url: string;
  file_path?: string;
}

/** Terminal failure statuses for WAV conversion (data.successFlag). */
const FAILED_STATUSES = new Set([
  "CREATE_TASK_FAILED",
  "GENERATE_WAV_FAILED",
  "CALLBACK_EXCEPTION",
  "SENSITIVE_WORD_ERROR",
]);

export async function convertToWav(
  input: ConvertToWavInput,
): Promise<ConvertToWavResult> {
  const createRes = (await sunoFetch("/wav/generate", {
    method: "POST",
    body: JSON.stringify({
      taskId: input.task_id,
      audioId: input.audio_id,
      callBackUrl: CALLBACK_URL,
    }),
  })) as SunoResponse<GenerateTaskResponse>;

  const wavTaskId = createRes.data.taskId;
  log("info", "wav conversion task started", {
    wavTaskId,
    audioId: input.audio_id,
  });

  // Poll the WAV-specific record-info endpoint.
  const deadline = Date.now() + input.poll_timeout_ms;
  const intervalMs = 5_000;
  let wavUrl = "";

  while (Date.now() < deadline) {
    const statusRes = (await sunoFetch(
      `/wav/record-info?taskId=${encodeURIComponent(wavTaskId)}`,
    )) as SunoResponse<{
      taskId: string;
      // WAV conversion uses `successFlag`; fall back to `status` defensively.
      successFlag?: string;
      status?: string;
      response?: { audioWavUrl?: string };
    }>;

    const record = statusRes.data;
    const state = record?.successFlag ?? record?.status ?? "";
    log("info", `wav task ${wavTaskId} status: ${state}`);

    if (state === "SUCCESS") {
      wavUrl = record.response?.audioWavUrl ?? "";
      break;
    }
    if (FAILED_STATUSES.has(state)) {
      throw new Error(
        `WAV conversion task ${wavTaskId} failed (status: ${state})`,
      );
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  if (!wavUrl) {
    throw new Error(
      `WAV conversion did not complete within ${Math.round(input.poll_timeout_ms / 1000)}s`,
    );
  }

  let filePath: string | undefined;
  if (input.download) {
    const title =
      input.title ??
      (await lookupSongTitle(input.task_id, input.audio_id)) ??
      input.audio_id;
    filePath = await downloadAudio(wavUrl, input.download_dir, title, "wav");
  }

  return {
    task_id: wavTaskId,
    audio_id: input.audio_id,
    wav_url: wavUrl,
    file_path: filePath,
  };
}

/** Best-effort lookup of a song's title from its original generation task. */
async function lookupSongTitle(
  taskId: string,
  audioId: string,
): Promise<string | undefined> {
  try {
    const res = (await sunoFetch(
      `/generate/record-info?taskId=${encodeURIComponent(taskId)}`,
    )) as SunoResponse<{ response?: { sunoData?: SongRecord[] } }>;
    const songs = res.data?.response?.sunoData ?? [];
    return songs.find((s) => s.id === audioId)?.title;
  } catch {
    return undefined;
  }
}
