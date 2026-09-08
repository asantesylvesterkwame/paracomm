export const voiceNoteMessages = {
	VOICE_NOTE_SENT: "Voice note sent",
	VOICE_NOTE_NOT_FOUND: "We could not find that voice note",
	MEDIA_NOT_FOUND: "That audio is not available",
	MEDIA_READY: "Audio ready",
	DUB_REQUESTED: "Translating this voice note",
	DUB_ALREADY_READY: "This voice note is already translated",
	DUB_SAME_LANGUAGE: "This voice note is already in that language",
	DUB_UNSUPPORTED: "We cannot voice that language yet",
	NOT_CONFIGURED: "Voice notes are not available right now",
	RATE_LIMITED: "You are sending voice notes too fast",
	DAILY_LIMIT_REACHED: "Daily voice note limit reached",
} as const;

export const voiceNoteCopy = {
	PLACEHOLDER: "Voice note",
} as const;
