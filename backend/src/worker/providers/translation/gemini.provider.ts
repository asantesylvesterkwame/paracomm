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
					generationConfig: {
						temperature: 0.1,
						maxOutputTokens: 1024,
						responseMimeType: "application/json",
						responseSchema: {
							type: "OBJECT",
							properties: {
								detectedLang: { type: "STRING", enum: [sourceLang, targetLang] },
								translation: { type: "STRING" },
							},
							required: ["detectedLang", "translation"],
						},
					},
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
		const raw = payload.candidates?.[0]?.content?.parts
			?.map((part) => part.text ?? "")
			.join("")
			.trim();
		if (!raw) {
			return { ok: false, error: "empty candidates" };
		}
		try {
			const parsed = JSON.parse(raw) as {
				detectedLang?: string;
				translation?: string;
			};
			if (!parsed.translation?.trim()) {
				return { ok: false, error: "empty translation" };
			}
			return {
				ok: true,
				text: parsed.translation.trim(),
				detectedLang: parsed.detectedLang,
			};
		} catch {
			return { ok: true, text: raw, detectedLang: sourceLang };
		}
	},
};
