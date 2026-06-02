import { sunoFetch } from "../lib/client.js";
import type { SunoResponse } from "../types/suno.js";

export async function checkCredits(): Promise<{ credits: number }> {
  const res = (await sunoFetch("/generate/credit")) as SunoResponse<number>;
  return { credits: res.data };
}
