import { sunoFetch } from "./client.js";
import { log } from "./logger.js";

export interface TaskRecord {
  taskId: string;
  status: "SUCCESS" | "GENERATING" | "FAILED" | "PENDING";
  response?: {
    data: SongData[];
  };
}

export interface SongData {
  id: string;
  audio_url: string;
  stream_audio_url: string;
  image_url: string;
  title: string;
  tags: string;
  duration: number;
  model_name: string;
  createTime: string;
}

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
    log("info", `task ${taskId} status: ${record.status}`);

    if (record.status === "SUCCESS") return record;
    if (record.status === "FAILED") {
      throw new Error(`Task ${taskId} failed on sunoapi.org`);
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
