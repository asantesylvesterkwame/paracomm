export const MAX_VOICE_NOTE_MS = 60000;

export const DURATION_GRACE_MS = 1500;

export const MIN_VOICE_NOTE_MS = 500;

export const MAX_VOICE_NOTE_BYTES = 3 * 1024 * 1024;

export const ACCEPTED_AUDIO_MIME_TYPES = [
	"audio/webm",
	"audio/ogg",
	"audio/mp4",
	"audio/wav",
] as const;

export const DUB_MIME_TYPE = "audio/wav";

export const STALE_DUB_MS = 120000;

export const TTS_UNSUPPORTED_LANGS: readonly string[] = ["tw", "ee", "ha", "yo"];

export const MEDIA_CACHE_CONTROL = "private, max-age=31536000, immutable";
