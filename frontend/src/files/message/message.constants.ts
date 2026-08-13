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
