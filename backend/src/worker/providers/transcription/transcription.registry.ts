import type { ITranscriptionProvider } from "./transcription.provider";
import { GeminiTranscriptionProvider } from "./gemini.provider";

export const getTranscriptionProviders = (env: Env): ITranscriptionProvider[] => {
	if (
		env.GEMINI_API_KEY &&
		env.GEMINI_API_KEY.length > 0 &&
		env.TRANSCRIPTION_MODEL &&
		env.TRANSCRIPTION_MODEL.length > 0
	) {
		return [GeminiTranscriptionProvider];
	}
	return [];
};
