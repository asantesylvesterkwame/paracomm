import type { ITranslationProvider } from "./translation.provider";

export const EchoProvider: ITranslationProvider = {
	name: "echo",
	async translate(_env, text, sourceLang, targetLang) {
		return {
			ok: true,
			text: `[dev echo ${targetLang}] ${text}`,
			detectedLang: sourceLang,
		};
	},
};
