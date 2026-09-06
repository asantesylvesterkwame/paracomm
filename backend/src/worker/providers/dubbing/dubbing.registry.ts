import type { IDubbingProvider } from "./dubbing.provider";
import { GeminiLiveDubbingProvider } from "./geminiLive.provider";

export const getDubbingProviders = (env: Env): IDubbingProvider[] => {
	if (
		env.GEMINI_API_KEY &&
		env.GEMINI_API_KEY.length > 0 &&
		env.DUBBING_MODEL &&
		env.DUBBING_MODEL.length > 0
	) {
		return [GeminiLiveDubbingProvider];
	}
	return [];
};
