export const callMessages = {
	CALL_STARTED: "Call started",
	CALL_JOINED: "Call joined",
	CALL_DECLINED: "Call declined",
	CALL_ENDED: "Call ended",
	CALL_NOT_FOUND: "That call is no longer available",
	CALL_ALREADY_RUNNING: "There is already a call in this conversation",
	CALL_NOT_JOINABLE: "That call has already finished",
	NOT_A_PARTICIPANT: "You are not part of this call",
	VIDEO_NOT_CONFIGURED: "Video calling is not configured on this server",
	VIDEO_PROVIDER_FAILED: "We could not start the call. Try again",
	CAPTION_TRANSLATED: "Caption translated",
	CAPTION_LIMIT_REACHED: "Too many captions. Slow down for a moment",
	CAPTION_DAILY_LIMIT_REACHED: "Daily free translation limit reached",
	CAPTION_PROVIDER_FAILED: "We could not translate that caption",
	CALLS_FETCHED: "Calls fetched",
} as const;

export const callEntryCopy = {
	ringing: "Video call",
	active: "Video call",
	ended: "Video call",
	missed: "Missed video call",
	declined: "Video call declined",
} as const;
