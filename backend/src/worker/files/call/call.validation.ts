import { z } from "zod";
import {
	INPUT_LANGUAGE_CODES,
	OUTPUT_LANGUAGE_CODES,
	MAX_UTTERANCE_CHARS,
} from "../../constants/languages";

export const startCall = z.object({
	clientId: z.string().min(1).max(64).optional(),
});

export type IStartCallBody = z.infer<typeof startCall>;

export const endCall = z.object({
	reason: z.enum(["hangup", "declined", "missed", "failed"]).default("hangup"),
});

export type IEndCallBody = z.infer<typeof endCall>;

export const translateCaption = z.object({
	text: z.string().trim().min(1).max(MAX_UTTERANCE_CHARS),
	sourceLang: z.enum([...INPUT_LANGUAGE_CODES, ...OUTPUT_LANGUAGE_CODES]),
	targetLang: z.enum(OUTPUT_LANGUAGE_CODES),
});

export type ITranslateCaptionBody = z.infer<typeof translateCaption>;
