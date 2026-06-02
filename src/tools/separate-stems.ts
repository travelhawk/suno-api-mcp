import { sunoFetch } from "../lib/client.js";
import { log } from "../lib/logger.js";
import type { SeparateStemsInput } from "../types/inputs.js";
import type { SunoResponse, GenerateTaskResponse, VocalSeparationResult } from "../types/suno.js";

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
    callBackUrl: "",
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

  // Poll for the vocal-removal result
  const deadline = Date.now() + input.poll_timeout_ms;
  const intervalMs = 5_000;

  while (Date.now() < deadline) {
    const statusRes = (await sunoFetch(
      `/generate/record-info?taskId=${encodeURIComponent(separationTaskId)}`,
    )) as SunoResponse<{
      taskId: string;
      status: string;
      response?: VocalSeparationResult;
    }>;

    const record = statusRes.data;
    log("info", `separation task ${separationTaskId} status: ${record.status}`);

    if (record.status === "SUCCESS") {
      const info = record.response?.vocal_removal_info ?? {};
      const stems: Record<string, string> = {};
      for (const [key, value] of Object.entries(info)) {
        if (value && key !== "origin_url") {
          stems[key] = value as string;
        }
      }
      if (info.origin_url) stems.origin_url = info.origin_url;

      return {
        task_id: separationTaskId,
        mode: input.mode,
        stems,
      };
    }

    if (record.status === "FAILED") {
      throw new Error(`Stem separation task ${separationTaskId} failed`);
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(
    `Stem separation did not complete within ${Math.round(input.poll_timeout_ms / 1000)}s`,
  );
}
