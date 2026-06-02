import { sunoFetch } from "../lib/client.js";
import { log } from "../lib/logger.js";
import type { CreatePersonaInput } from "../types/inputs.js";
import type { SunoResponse, PersonaResponse } from "../types/suno.js";

export interface CreatePersonaResult {
  persona_id: string;
  name: string;
  description: string;
}

export async function createPersona(input: CreatePersonaInput): Promise<CreatePersonaResult> {
  const segmentSeconds = input.vocal_end - input.vocal_start;
  if (segmentSeconds < 10 || segmentSeconds > 30) {
    throw new Error(
      `Persona sample window must be 10–30 seconds (got ${segmentSeconds}s). ` +
        "Adjust vocal_start and vocal_end.",
    );
  }

  const body: Record<string, unknown> = {
    taskId: input.task_id,
    audioId: input.audio_id,
    name: input.name,
    description: input.description,
    vocalStart: input.vocal_start,
    vocalEnd: input.vocal_end,
  };
  if (input.style) body.style = input.style;

  log("info", "creating persona", {
    audioId: input.audio_id,
    name: input.name,
    segmentSeconds,
  });

  const res = (await sunoFetch("/generate/generate-persona", {
    method: "POST",
    body: JSON.stringify(body),
  })) as SunoResponse<PersonaResponse>;

  log("info", "persona created", { personaId: res.data.personaId });

  return {
    persona_id: res.data.personaId,
    name: res.data.name,
    description: res.data.description,
  };
}
