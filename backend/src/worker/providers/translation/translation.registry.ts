import type { ITranslationProvider } from "./translation.provider";
import { GeminiProvider } from "./gemini.provider";
import { EchoProvider } from "./echo.provider";

export const getTranslationProviders = (env: Env): ITranslationProvider[] => {
	if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 0) {
		return [GeminiProvider];
	}
	return [EchoProvider];
};
