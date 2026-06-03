export interface SunoResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface GenerateTaskResponse {
  taskId: string;
}

export interface SongRecord {
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

/**
 * record-info statuses returned by sunoapi.org.
 * SUCCESS is terminal-success; the *_FAILED / *_ERROR / EXCEPTION values are
 * terminal-failure. PENDING / TEXT_SUCCESS / FIRST_SUCCESS are in-progress.
 */
export type TaskStatus =
  | "PENDING"
  | "TEXT_SUCCESS"
  | "FIRST_SUCCESS"
  | "SUCCESS"
  | "CREATE_TASK_FAILED"
  | "GENERATE_AUDIO_FAILED"
  | "CALLBACK_EXCEPTION"
  | "SENSITIVE_WORD_ERROR";

export interface TaskStatusResponse {
  taskId: string;
  status: TaskStatus;
  response?: {
    sunoData?: SongRecord[];
  };
}

export interface LyricsRecord {
  text: string;
  title: string;
  status: "complete" | "failed";
  errorMessage?: string;
}

export interface ExtendedSongRecord extends SongRecord {
  source_audio_url?: string;
  source_stream_audio_url?: string;
  source_image_url?: string;
  prompt?: string;
}

export interface VocalSeparationResult {
  task_id: string;
  vocal_removal_info: {
    // vocals_only mode
    vocal_url?: string;
    instrumental_url?: string;
    origin_url?: string;
    // full_stems mode
    backing_vocals_url?: string;
    drums_url?: string;
    bass_url?: string;
    guitar_url?: string;
    keyboard_url?: string;
    strings_url?: string;
    brass_url?: string;
    woodwinds_url?: string;
    percussion_url?: string;
    synth_url?: string;
    fx_url?: string;
  };
}

export interface PersonaResponse {
  personaId: string;
  name: string;
  description: string;
}
