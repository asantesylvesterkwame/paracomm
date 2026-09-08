export const CALL_EVENTS = {
  RINGING: "call:ringing",
  ACCEPTED: "call:accepted",
  DECLINED: "call:declined",
  ENDED: "call:ended",
} as const;

export const CAPTION_WIRE_KIND = "paracomm-caption";

export const LANG_WIRE_KIND = "paracomm-lang";

export const LANG_SYNC_DEBOUNCE_MS = 300;

export const CAPTION_HISTORY_LINES = 2;

export const CAPTION_INTERIM_CLEAR_MS = 4000;

export const MAX_CAPTION_CHARS = 500;

export const RING_TIMEOUT_MS = 45000;

export const CALL_COPY = {
  START: "Start video call",
  CALLING: "Calling",
  INCOMING: "Incoming video call",
  ANSWER: "Answer",
  DECLINE: "Decline",
  HANG_UP: "Leave call",
  MUTE: "Mute microphone",
  UNMUTE: "Unmute microphone",
  CAMERA_ON: "Turn camera on",
  CAMERA_OFF: "Turn camera off",
  CAPTIONS_ON: "Turn subtitles on",
  CAPTIONS_OFF: "Turn subtitles off",
  CAPTIONS_IDLE: "Subtitles appear here as you both speak",
  CAPTIONS_DISABLED: "Subtitles are off",
  CAPTIONS_UNSUPPORTED:
    "Subtitles need Chrome, Edge or Safari. Video and audio work here.",
  CAPTIONS_MIC_MUTED: "Your microphone is muted, so nobody sees your subtitles",
  UNTRANSLATED: "Showing original",
  DUBBING_ON: "Turn voice translation on",
  DUBBING_OFF: "Turn voice translation off",
  DUBBING_IDLE: "You will hear them in your language as they speak",
  MINIMIZE: "Minimize call",
  EXPAND: "Back to call",
  RECONNECTING: "Reconnecting",
  WAITING: "Waiting for them to join",
  HEAR_IN: "Hear them in",
  HEAR_IN_HINT: "Subtitles and voice follow this language",
  SUBTITLES_ONLY: "Subtitles only",
  CHANGE_LANGUAGE: "Change the language you hear",
} as const;

export const hearingIn = (label: string) => `Now hearing ${label}`;

export const CALL_ENTRY_COPY = {
  ringing: "Video call",
  active: "Video call",
  ended: "Video call",
  missed: "Missed video call",
  declined: "Video call declined",
} as const;
