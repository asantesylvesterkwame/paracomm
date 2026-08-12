import { z } from "zod";
import {
	INPUT_LANGUAGE_CODES,
	OUTPUT_LANGUAGE_CODES,
	MAX_UTTERANCE_CHARS,
} from "./live.constants";

export const translateLive = z.object({
	text: z.string().trim().min(1).max(MAX_UTTERANCE_CHARS),
	sourceLang: z.enum(INPUT_LANGUAGE_CODES),
	targetLang: z.enum(OUTPUT_LANGUAGE_CODES),
});

export type ITranslateLiveBody = z.infer<typeof translateLive>;

export const speakLive = z.object({
	text: z.string().trim().min(1).max(MAX_UTTERANCE_CHARS),
	lang: z.enum(OUTPUT_LANGUAGE_CODES),
});

export type ISpeakLiveBody = z.infer<typeof speakLive>;
