import { sunoFetch, CALLBACK_URL } from "../lib/client.js";
import { log } from "../lib/logger.js";
import { downloadAudio } from "../lib/download.js";
import type { CreateMusicVideoInput } from "../types/inputs.js";
import type { SunoResponse, GenerateTaskResponse, SongRecord } from "../types/suno.js";

export interface CreateMusicVideoResult {
  task_id: string; // the MP4 generation task id
  audio_id: string;
  video_url: string;
  file_path?: string;
}

/** Terminal failure statuses for MP4 generation (data.successFlag). */
const FAILED_STATUSES = new Set([
  "CREATE_TASK_FAILED",
  "GENERATE_MP4_FAILED",
  "CALLBACK_EXCEPTION",
  "SENSITIVE_WORD_ERROR",
]);

export async function createMusicVideo(
  input: CreateMusicVideoInput,
): Promise<CreateMusicVideoResult> {
  const body: Record<string, unknown> = {
    taskId: input.task_id,
    audioId: input.audio_id,
    callBackUrl: CALLBACK_URL,
  };
  if (input.author) body.author = input.author;
  if (input.domain_name) body.domainName = input.domain_name;

  const createRes = (await sunoFetch("/mp4/generate", {
    method: "POST",
    body: JSON.stringify(body),
  })) as SunoResponse<GenerateTaskResponse>;

  const videoTaskId = createRes.data.taskId;
  log("info", "music video task started", {
    videoTaskId,
    audioId: input.audio_id,
  });

  // Poll the MP4-specific record-info endpoint.
  const deadline = Date.now() + input.poll_timeout_ms;
  const intervalMs = 5_000;
  let videoUrl = "";

  while (Date.now() < deadline) {
    const statusRes = (await sunoFetch(
      `/mp4/record-info?taskId=${encodeURIComponent(videoTaskId)}`,
    )) as SunoResponse<{
      taskId: string;
      // MP4 generation uses `successFlag`; fall back to `status` defensively.
      successFlag?: string;
      status?: string;
      response?: { videoUrl?: string };
    }>;

    const record = statusRes.data;
    const state = record?.successFlag ?? record?.status ?? "";
    log("info", `music video task ${videoTaskId} status: ${state}`);

    if (state === "SUCCESS") {
      videoUrl = record.response?.videoUrl ?? "";
      break;
    }
    if (FAILED_STATUSES.has(state)) {
      throw new Error(
        `Music video task ${videoTaskId} failed (status: ${state})`,
      );
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  if (!videoUrl) {
    throw new Error(
      `Music video did not complete within ${Math.round(input.poll_timeout_ms / 1000)}s`,
    );
  }

  let filePath: string | undefined;
  if (input.download) {
    const title =
      input.title ??
      (await lookupSongTitle(input.task_id, input.audio_id)) ??
      input.audio_id;
    filePath = await downloadAudio(videoUrl, input.download_dir, title, "mp4");
  }

  return {
    task_id: videoTaskId,
    audio_id: input.audio_id,
    video_url: videoUrl,
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
