import { z } from "zod";
import { OUTPUT_LANGUAGE_CODES } from "../../constants/languages";
import {
	ACCEPTED_AUDIO_MIME_TYPES,
	DURATION_GRACE_MS,
	MAX_VOICE_NOTE_BYTES,
	MAX_VOICE_NOTE_MS,
	MIN_VOICE_NOTE_MS,
} from "./voice-note.constants";

export const sendVoiceNote = z.object({
	audio: z
		.file()
		.min(1)
		.max(MAX_VOICE_NOTE_BYTES)
		.mime([...ACCEPTED_AUDIO_MIME_TYPES]),
	durationMs: z.coerce
		.number()
		.int()
		.min(MIN_VOICE_NOTE_MS)
		.max(MAX_VOICE_NOTE_MS + DURATION_GRACE_MS),
	clientId: z.string().uuid().optional(),
});

export type ISendVoiceNoteBody = z.infer<typeof sendVoiceNote>;

export const requestDub = z.object({
	lang: z.enum(OUTPUT_LANGUAGE_CODES),
});

export type IRequestDubBody = z.infer<typeof requestDub>;

export const getVoiceNoteMedia = z.object({
	dub: z.enum(OUTPUT_LANGUAGE_CODES).optional(),
});

export type IGetVoiceNoteMediaQuery = z.infer<typeof getVoiceNoteMedia>;
