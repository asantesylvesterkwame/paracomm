export const DUBBING_SUPPORTED_LANGS: readonly string[] = [
  "en",
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "nl",
  "pl",
  "ru",
  "tr",
  "sv",
  "id",
  "hi",
  "ar",
  "zh",
  "ja",
  "ko",
];

export const CAPTURE_SAMPLE_RATE = 16000;

export const PLAYBACK_SAMPLE_RATE = 24000;

export const CAPTURE_MIME_TYPE = `audio/pcm;rate=${CAPTURE_SAMPLE_RATE}`;

export const TOKEN_REFRESH_MARGIN_MS = 60000;

export const RECONNECT_BASE_MS = 800;

export const RECONNECT_MAX_MS = 8000;

export const DUBBING_HISTORY_LINES = 2;

export const MAX_DUBBING_LINE_CHARS = 220;

export const DUBBING_COPY = {
  ON: "Turn voice translation on",
  OFF: "Turn voice translation off",
  CONNECTING: "Starting voice",
  RECONNECTING: "Reconnecting voice",
  LIVE: "Voice",
  LIMITED: "Voice limit reached",
  FAILED: "Voice translation stopped. Subtitles still work",
  UNSUPPORTED_LANGUAGE:
    "Voice translation does not cover this language yet. Subtitles still work",
  NOT_CONFIGURED: "Voice translation is not available right now",
  NO_SPEECH_YET: "You will hear them in your language as they speak",
} as const;
