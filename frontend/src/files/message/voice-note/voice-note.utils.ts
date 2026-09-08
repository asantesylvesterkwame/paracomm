import { encodeWavFromBlob } from "@/utils/audio";
import {
  UPLOAD_MIME_TYPES,
  WAV_UPLOAD_SAMPLE_RATE,
} from "./voice-note.constants";
import type { IRecording, IVoiceNote, IVoiceNoteDub } from "./voice-note.interface";

const EXTENSION_OF: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
};

const pendingRecordings = new Map<string, IRecording>();

export const pendingRecordingStore = {
  put: (clientId: string, recording: IRecording) => {
    pendingRecordings.set(clientId, recording);
  },
  get: (clientId: string | null | undefined) =>
    clientId ? (pendingRecordings.get(clientId) ?? null) : null,
  has: (clientId: string | null | undefined) =>
    Boolean(clientId && pendingRecordings.has(clientId)),
  take: (clientId: string | null | undefined) => {
    if (!clientId) return null;
    const recording = pendingRecordings.get(clientId) ?? null;
    pendingRecordings.delete(clientId);
    return recording;
  },
};

export const extensionOf = (mimeType: string) =>
  EXTENSION_OF[mimeType] ?? "bin";

export const prepareRecording = async (
  recording: IRecording,
): Promise<IRecording> => {
  if (UPLOAD_MIME_TYPES.includes(recording.mimeType)) return recording;
  const blob = await encodeWavFromBlob(recording.blob, WAV_UPLOAD_SAMPLE_RATE);
  return { blob, mimeType: "audio/wav", durationMs: recording.durationMs };
};

export const doneDubsOf = (voiceNote: IVoiceNote | null | undefined) =>
  (voiceNote?.dubs ?? []).filter((dub) => dub.status === "done");

export const dubFor = (
  voiceNote: IVoiceNote | null | undefined,
  lang: string | null,
): IVoiceNoteDub | undefined =>
  lang ? voiceNote?.dubs.find((dub) => dub.lang === lang) : undefined;

export const playbackKeyOf = (voiceNoteId: string, lang: string | null) =>
  `${voiceNoteId}:${lang ?? "original"}`;

export const isOriginalInLang = (
  voiceNote: IVoiceNote | null | undefined,
  lang: string,
) =>
  Boolean(
    voiceNote?.transcriptLang &&
      voiceNote.transcriptLang.split("-")[0] === lang.split("-")[0],
  );
