import type { RecorderStatus } from "@/hooks/useVoiceRecorder";
export type { IRecording } from "@/hooks/useVoiceRecorder";

export type TranscriptionStatus = "pending" | "done" | "failed";

export type VoiceDubStatus = "pending" | "done" | "failed";

export interface IVoiceNoteDub {
  id: string;
  voiceNoteId: string;
  lang: string;
  text: string | null;
  mimeType: string | null;
  durationMs: number | null;
  byteSize: number | null;
  status: VoiceDubStatus;
  error: string | null;
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IVoiceNote {
  id: string;
  messageId: string;
  roomId: string;
  senderId: string;
  mimeType: string;
  durationMs: number;
  byteSize: number;
  transcript: string | null;
  transcriptLang: string | null;
  transcriptionStatus: TranscriptionStatus;
  transcriptionError: string | null;
  dubs: IVoiceNoteDub[];
  createdAt: string;
  updatedAt: string;
}

export interface IRequestDubRequest {
  lang: string;
}

export interface IDubRequestTarget {
  messageId: string;
  lang: string;
}

export interface IVoiceRecorderControls {
  status: RecorderStatus;
  elapsedMs: number;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  cancel: () => void;
}
