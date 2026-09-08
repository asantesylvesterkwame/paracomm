export const MAX_VOICE_NOTE_MS = 60000;

export const MIN_VOICE_NOTE_MS = 500;

export const VOICE_UPLOAD_TIMEOUT_MS = 30000;

export const VOICE_MEDIA_TIMEOUT_MS = 30000;

export const DUB_HINT_DELAY_MS = 500;

export const WAV_UPLOAD_SAMPLE_RATE = 16000;

export const UPLOAD_MIME_TYPES: readonly string[] = [
  "audio/webm",
  "audio/ogg",
  "audio/wav",
];

export const VOICE_COPY = {
  RECORD: "Record a voice note",
  STOP: "Stop and send",
  CANCEL: "Discard recording",
  RECORDING: "Recording",
  LIMIT_HINT: "Up to one minute",
  PREPARING: "Preparing",
  PERMISSION_DENIED: "Allow microphone access to record a voice note",
  UNSUPPORTED: "Voice notes need a newer browser",
  TOO_SHORT: "Hold on a little longer before you stop",
  RECORDING_FAILED: "That recording did not work. Try again",
  PLAY: "Play voice note",
  PAUSE: "Pause voice note",
  PREVIEW: "Voice note",
  TRANSCRIBING: "Listening",
  NO_SPEECH: "No speech detected. Tap to try again",
  TRANSCRIPTION_FAILED: "Could not hear this note. Tap to try again",
  DUB_FAILED: "Could not voice this note. Tap to try again",
  DUB_UNSUPPORTED: "Voice is not available for this language yet",
  DUB_QUOTA: "Daily voice limit reached. Try again tomorrow",
  ORIGINAL: "Original",
  IN_YOUR_LANGUAGE: "Already in your language",
  HEAR_IN: "Hear it in another language",
  HEAR_IN_HINT: "Anyone in this chat can add a language",
  READY: "Ready",
  NO_VOICE: "No voice",
  RECORDING_LOST: "That recording was lost. Record it again",
  DISMISS: "Dismiss",
  SHOW_ORIGINAL: "Show what they said",
  HIDE_ORIGINAL: "Hide the original",
} as const;

export const voicingIn = (label: string) => `Voicing in ${label}`;

export const originalIn = (label: string) => `${VOICE_COPY.ORIGINAL} · ${label}`;
