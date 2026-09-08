import { createLogger } from "../../utils/logger";
import type {
	ITranscriptionProvider,
	ITranscriptionInput,
	ITranscriptionOutcome,
} from "./transcription.provider";

interface IGeminiContentBlock {
	type?: string;
	text?: string;
}

interface IGeminiInteractionResponse {
	output_text?: string;
	steps?: { type?: string; content?: IGeminiContentBlock[] }[];
}

const logger = createLogger("transcription:gemini");

const INTERACTIONS_URL =
	"https://generativelanguage.googleapis.com/v1beta/interactions";

const MAX_BODY_LOG_CHARS = 1000;

const extractText = (payload: IGeminiInteractionResponse) => {
	if (typeof payload.output_text === "string") return payload.output_text;
	return (payload.steps ?? [])
		.flatMap((step) => step.content ?? [])
		.filter((block) => block.type === "text" && block.text)
		.map((block) => block.text)
		.join(" ");
};

const requestTranscript = async (
	env: Env,
	input: ITranscriptionInput,
): Promise<ITranscriptionOutcome> => {
	const startedAt = Date.now();
	logger.log("requesting transcript", {
		model: env.TRANSCRIPTION_MODEL,
		mimeType: input.mimeType,
		base64Chars: input.audioBase64.length,
	});
	let response: Response;
	try {
		response = await fetch(INTERACTIONS_URL, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-goog-api-key": env.GEMINI_API_KEY,
			},
			body: JSON.stringify({
				model: env.TRANSCRIPTION_MODEL,
				input: [
					{
						type: "audio",
						data: input.audioBase64,
						mime_type: input.mimeType,
					},
				],
			}),
		});
	} catch (error) {
		logger.error("transcript fetch threw", { error: String(error) });
		return { ok: false, error: `gemini transcribe fetch failed: ${String(error)}` };
	}
	const text = await response.text();
	logger.log("transcript response", {
		status: response.status,
		elapsedMs: Date.now() - startedAt,
		bodyPreview: response.ok ? undefined : text.slice(0, MAX_BODY_LOG_CHARS),
	});
	if (!response.ok) {
		return {
			ok: false,
			error: `gemini transcribe http ${response.status}: ${text.slice(0, MAX_BODY_LOG_CHARS)}`,
		};
	}
	let payload: IGeminiInteractionResponse;
	try {
		payload = JSON.parse(text) as IGeminiInteractionResponse;
	} catch (error) {
		return { ok: false, error: `transcript body was not json: ${String(error)}` };
	}
	const transcript = extractText(payload).trim();
	if (!transcript) {
		return { ok: false, error: "empty transcript" };
	}
	logger.log("transcript ready", { chars: transcript.length });
	return { ok: true, text: transcript };
};

export const GeminiTranscriptionProvider: ITranscriptionProvider = {
	name: "gemini-transcribe",
	async transcribe(env, input) {
		const first = await requestTranscript(env, input);
		if (first.ok || first.error === "empty transcript") return first;
		logger.warn("first transcript attempt failed, retrying once", {
			error: first.error,
		});
		return requestTranscript(env, input);
	},
};
