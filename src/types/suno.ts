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
  audio_url: string;
  stream_audio_url: string;
  image_url: string;
  title: string;
  tags: string;
  duration: number;
  model_name: string;
  createTime: string;
}

export interface TaskStatusResponse {
  taskId: string;
  status: "SUCCESS" | "GENERATING" | "FAILED" | "PENDING";
  response?: {
    data: SongRecord[];
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
