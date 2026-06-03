import { sunoFetch } from "./client.js";
import { log } from "./logger.js";

export interface SongData {
  id: string;
  audioUrl: string;
  streamAudioUrl: string;
  imageUrl: string;
  title: string;
  tags: string;
  duration: number;
  modelName: string;
  prompt?: string;
  createTime: string;
}

export interface TaskRecord {
  taskId: string;
  status: string;
  response?: {
    sunoData?: SongData[];
  };
}

/** Terminal failure statuses returned by sunoapi.org record-info. */
const FAILED_STATUSES = new Set([
  "CREATE_TASK_FAILED",
  "GENERATE_AUDIO_FAILED",
  "CALLBACK_EXCEPTION",
  "SENSITIVE_WORD_ERROR",
]);

export async function pollUntilDone(
  taskId: string,
  maxMs = 300_000,
  intervalMs = 5_000,
): Promise<TaskRecord> {
  const deadline = Date.now() + maxMs;

  while (Date.now() < deadline) {
    const res = (await sunoFetch(
      `/generate/record-info?taskId=${encodeURIComponent(taskId)}`,
    )) as { code: number; data: TaskRecord };

    const record = res.data;
    log("info", `task ${taskId} status: ${record?.status}`);

    if (record?.status === "SUCCESS") return record;
    if (FAILED_STATUSES.has(record?.status)) {
      throw new Error(
        `Task ${taskId} failed on sunoapi.org (status: ${record.status})`,
      );
    }

    await sleep(intervalMs);
  }

  throw new Error(
    `Task ${taskId} did not complete within ${Math.round(maxMs / 1000)}s`,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
