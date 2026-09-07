export const MESSAGE_EVENTS = {
  NEW: "message:new",
  UPDATED: "message:updated",
  DELETED: "message:deleted",
  SEEN: "message:seen",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  ROOM_UPDATED: "room:updated",
} as const;

export const TYPING_THROTTLE_MS = 3000;
export const TYPING_CLEAR_MS = 5000;
export const MAX_MESSAGE_CHARS = 2000;
export const TEMP_ID_PREFIX = "temp_";
export const QUEUE_RETRY_DELAY_MS = 800;
export const TRANSLATING_HINT_DELAY_MS = 500;

export const SEND_ERROR_COPY = {
  network: "No connection. This will send when you are back",
  rate: "Too many messages. Wait a moment, then tap to retry",
  fatal: "That message could not be sent. Tap to retry",
} as const;
