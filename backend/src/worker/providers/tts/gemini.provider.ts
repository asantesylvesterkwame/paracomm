import type { ITtsProvider, ITtsOutcome } from "./tts.provider";
import { pcmToWavBase64 } from "./tts.utils";

interface IGeminiTtsContent {
	type?: string;
	data?: string;
	sample_rate?: number;
	channels?: number;
}

interface IGeminiTtsResponse {
	steps?: { type?: string; content?: IGeminiTtsContent[] }[];
}

const requestSpeech = async (env: Env, text: string): Promise<ITtsOutcome> => {
	const response = await fetch(
		"https://generativelanguage.googleapis.com/v1beta/interactions",
		{
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-goog-api-key": env.GEMINI_API_KEY,
			},
			body: JSON.stringify({
				model: env.TTS_MODEL,
				input: text,
				response_format: { type: "audio" },
				generation_config: {
					speech_config: [{ voice: env.TTS_VOICE }],
				},
			}),
		},
	);
	if (!response.ok) {
		return { ok: false, error: `gemini tts http ${response.status}` };
	}
	const payload = (await response.json()) as IGeminiTtsResponse;
	const audio = payload.steps
		?.flatMap((step) => step.content ?? [])
		.find((block) => block.type === "audio" && block.data);
	if (!audio?.data) {
		return { ok: false, error: "missing output audio" };
	}
	return {
		ok: true,
		audioBase64: pcmToWavBase64(audio.data, audio.sample_rate, audio.channels),
		mimeType: "audio/wav",
	};
};

export const GeminiTtsProvider: ITtsProvider = {
	name: "gemini-tts",
	async speak(env, text) {
		const first = await requestSpeech(env, text);
		if (first.ok) return first;
		return requestSpeech(env, text);
	},
};
