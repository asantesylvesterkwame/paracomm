import type { ITtsProvider } from "./tts.provider";
import { GeminiTtsProvider } from "./gemini.provider";

export const getTtsProviders = (env: Env): ITtsProvider[] => {
	if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 0) {
		return [GeminiTtsProvider];
	}
	return [];
};
