import type { ITranslationProvider, ITranslationMode } from "./translation.provider";
import {
	buildAutoPrompt,
	buildCaptionPrompt,
	buildTranslationPrompt,
	SUPPORTED_DETECTION_CODES,
} from "./translation.utils";

interface IGeminiResponse {
	candidates?: { content?: { parts?: { text?: string }[] } }[];
	promptFeedback?: { blockReason?: string };
}

const promptFor = (
	mode: ITranslationMode,
	sourceLang: string | null,
	targetLang: string,
) => {
	if (mode === "auto" || !sourceLang) return buildAutoPrompt(targetLang);
	if (mode === "caption") return buildCaptionPrompt(sourceLang, targetLang);
	return buildTranslationPrompt(sourceLang, targetLang);
};

const detectionEnumFor = (
	mode: ITranslationMode,
	sourceLang: string | null,
	targetLang: string,
) =>
	mode === "auto" || !sourceLang
		? SUPPORTED_DETECTION_CODES
		: [sourceLang, targetLang];

export const GeminiProvider: ITranslationProvider = {
	name: "gemini",
	async translate(env, text, sourceLang, targetLang, options) {
		const mode = options?.mode ?? "chat";
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
						parts: [{ text: promptFor(mode, sourceLang, targetLang) }],
					},
					contents: [{ role: "user", parts: [{ text }] }],
					generationConfig: {
						temperature: 0.1,
						maxOutputTokens: 1024,
						responseMimeType: "application/json",
						responseSchema: {
							type: "OBJECT",
							properties: {
								detectedLang: {
									type: "STRING",
									enum: detectionEnumFor(mode, sourceLang, targetLang),
								},
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
			return { ok: true, text: raw, detectedLang: sourceLang ?? undefined };
		}
	},
};
