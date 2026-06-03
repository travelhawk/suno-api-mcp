import { sunoFetch, CALLBACK_URL } from "../lib/client.js";
import { log } from "../lib/logger.js";
import type { WriteLyricsInput } from "../types/inputs.js";
import type { SunoResponse, GenerateTaskResponse, LyricsRecord } from "../types/suno.js";

export interface WriteLyricsResult {
  task_id: string;
  lyrics: Array<{ title: string; text: string }>;
}

export async function writeLyrics(input: WriteLyricsInput): Promise<WriteLyricsResult> {
  const body = { prompt: input.theme, callBackUrl: CALLBACK_URL };

  const createRes = (await sunoFetch("/lyrics", {
    method: "POST",
    body: JSON.stringify(body),
  })) as SunoResponse<GenerateTaskResponse>;

  const taskId = createRes.data.taskId;
  log("info", `lyrics task started`, { taskId });

  // Poll for completion
  const deadline = Date.now() + input.poll_timeout_ms;
  const intervalMs = 4_000;

  const failedStatuses = new Set([
    "CREATE_TASK_FAILED",
    "GENERATE_LYRICS_FAILED",
    "CALLBACK_EXCEPTION",
    "SENSITIVE_WORD_ERROR",
  ]);

  while (Date.now() < deadline) {
    const statusRes = (await sunoFetch(
      `/lyrics/record-info?taskId=${encodeURIComponent(taskId)}`,
    )) as SunoResponse<{
      taskId: string;
      status: string;
      response?: { data: LyricsRecord[] };
    }>;

    const record = statusRes.data;
    log("info", `lyrics task ${taskId} status: ${record?.status}`);

    if (record?.status === "SUCCESS") {
      const items = record.response?.data ?? [];
      return {
        task_id: taskId,
        lyrics: items
          .filter((l) => l.status === "complete")
          .map((l) => ({ title: l.title, text: l.text })),
      };
    }

    if (failedStatuses.has(record?.status)) {
      throw new Error(`Lyrics task ${taskId} failed (status: ${record.status})`);
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(
    `Lyrics task ${taskId} did not complete within ${Math.round(input.poll_timeout_ms / 1000)}s`,
  );
}
