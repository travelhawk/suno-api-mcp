import { sunoFetch, CALLBACK_URL } from "../lib/client.js";
import { log } from "../lib/logger.js";
import type { SeparateStemsInput } from "../types/inputs.js";
import type { SunoResponse, GenerateTaskResponse } from "../types/suno.js";

export interface SeparateStemsResult {
  task_id: string;
  mode: "vocals_only" | "full_stems";
  stems: Record<string, string>;
}

export async function separateStems(input: SeparateStemsInput): Promise<SeparateStemsResult> {
  const separationType = input.mode === "full_stems" ? "split_stem" : "separate_vocal";

  const body = {
    taskId: input.task_id,
    audioId: input.audio_id,
    type: separationType,
    callBackUrl: CALLBACK_URL,
  };

  log("info", "starting stem separation", {
    audioId: input.audio_id,
    type: separationType,
  });

  const createRes = (await sunoFetch("/vocal-removal/generate", {
    method: "POST",
    body: JSON.stringify(body),
  })) as SunoResponse<GenerateTaskResponse>;

  const separationTaskId = createRes.data.taskId;
  log("info", `stem separation task started`, { taskId: separationTaskId });

  // Poll the vocal-removal-specific record-info endpoint.
  const deadline = Date.now() + input.poll_timeout_ms;
  const intervalMs = 5_000;
  const failedStatuses = new Set([
    "CREATE_TASK_FAILED",
    "GENERATE_AUDIO_FAILED",
    "CALLBACK_EXCEPTION",
    "SENSITIVE_WORD_ERROR",
  ]);

  while (Date.now() < deadline) {
    const statusRes = (await sunoFetch(
      `/vocal-removal/record-info?taskId=${encodeURIComponent(separationTaskId)}`,
    )) as SunoResponse<{
      taskId: string;
      // vocal-removal uses `successFlag`; fall back to `status` defensively.
      successFlag?: string;
      status?: string;
      response?: Record<string, unknown>;
    }>;

    const record = statusRes.data;
    const state = record?.successFlag ?? record?.status ?? "";
    log("info", `separation task ${separationTaskId} status: ${state}`);

    if (state === "SUCCESS") {
      // Stem URLs live directly on data.response as camelCase *Url fields.
      const info = record.response ?? {};
      const stems: Record<string, string> = {};
      for (const [key, value] of Object.entries(info)) {
        if (typeof value === "string" && value && key.endsWith("Url")) {
          stems[key] = value;
        }
      }

      return {
        task_id: separationTaskId,
        mode: input.mode,
        stems,
      };
    }

    if (failedStatuses.has(state)) {
      throw new Error(
        `Stem separation task ${separationTaskId} failed (status: ${state})`,
      );
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(
    `Stem separation did not complete within ${Math.round(input.poll_timeout_ms / 1000)}s`,
  );
}
