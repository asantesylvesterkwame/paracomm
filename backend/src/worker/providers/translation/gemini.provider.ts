import type { ITranslationProvider } from "./translation.provider";
import { buildTranslationPrompt } from "../../files/live/live.utils";

interface IGeminiResponse {
	candidates?: { content?: { parts?: { text?: string }[] } }[];
	promptFeedback?: { blockReason?: string };
}

export const GeminiProvider: ITranslationProvider = {
	name: "gemini",
	async translate(env, text, sourceLang, targetLang) {
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/${env.TRANSLATION_MODEL}:generateContent`,
			{
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-goog-api-key": env.GEMINI_API_KEY,
				},
				body: JSON.stringify({
					system_instruction: {
						parts: [{ text: buildTranslationPrompt(sourceLang, targetLang) }],
					},
					contents: [{ role: "user", parts: [{ text }] }],
					generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
				}),
			},
		);
		if (!response.ok) {
			return { ok: false, error: `gemini http ${response.status}` };
		}
		const payload = (await response.json()) as IGeminiResponse;
		if (payload.promptFeedback?.blockReason) {
			return { ok: false, error: payload.promptFeedback.blockReason };
		}
		const translated = payload.candidates?.[0]?.content?.parts
			?.map((part) => part.text ?? "")
			.join("")
			.trim();
		if (!translated) {
			return { ok: false, error: "empty candidates" };
		}
		return { ok: true, text: translated };
	},
};
