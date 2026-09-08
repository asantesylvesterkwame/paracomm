import { createLogger } from "../../utils/logger";
import type {
	IDubbingProvider,
	IDubbingOutcome,
	IDubbingSessionRequest,
} from "./dubbing.provider";

interface IAuthTokenResponse {
	name?: string;
}

const logger = createLogger("dubbing:gemini");

const RECONNECT_WINDOW_SECONDS = 600;

const AUTH_TOKENS_URL =
	"https://generativelanguage.googleapis.com/v1beta/auth_tokens";

const MAX_BODY_LOG_CHARS = 2000;

const buildBody = (env: Env, request: IDubbingSessionRequest) => {
	const expiresAt = new Date(
		Date.now() + request.ttlSeconds * 1000,
	).toISOString();
	return {
		uses: Math.ceil(request.ttlSeconds / RECONNECT_WINDOW_SECONDS) + 2,
		expireTime: expiresAt,
		newSessionExpireTime: expiresAt,
		bidiGenerateContentSetup: {
			model: `models/${env.DUBBING_MODEL}`,
			generationConfig: {
				responseModalities: ["AUDIO"],
				translationConfig: {
					targetLanguageCode: request.targetLang,
					echoTargetLanguage: false,
				},
			},
			inputAudioTranscription: {},
			outputAudioTranscription: {},
		},
	};
};

const requestToken = async (
	env: Env,
	request: IDubbingSessionRequest,
): Promise<IDubbingOutcome> => {
	const body = buildBody(env, request);
	logger.log("requesting auth token", {
		url: AUTH_TOKENS_URL,
		model: body.bidiGenerateContentSetup.model,
		targetLang: request.targetLang,
		ttlSeconds: request.ttlSeconds,
		uses: body.uses,
		expireTime: body.expireTime,
		apiKeyPresent: Boolean(env.GEMINI_API_KEY),
		apiKeyPrefix: env.GEMINI_API_KEY?.slice(0, 6),
		body,
	});
	const startedAt = Date.now();
	let response: Response;
	try {
		response = await fetch(AUTH_TOKENS_URL, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-goog-api-key": env.GEMINI_API_KEY,
			},
			body: JSON.stringify(body),
		});
	} catch (error) {
		logger.error("auth token fetch threw", {
			elapsedMs: Date.now() - startedAt,
			error: String(error),
		});
		return { ok: false, error: `gemini auth_tokens fetch failed: ${String(error)}` };
	}
	const text = await response.text();
	logger.log("auth token response", {
		status: response.status,
		ok: response.ok,
		elapsedMs: Date.now() - startedAt,
		bodyPreview: response.ok ? undefined : text.slice(0, MAX_BODY_LOG_CHARS),
	});
	if (!response.ok) {
		return {
			ok: false,
			error: `gemini auth_tokens http ${response.status}: ${text.slice(0, MAX_BODY_LOG_CHARS)}`,
		};
	}
	let payload: IAuthTokenResponse;
	try {
		payload = JSON.parse(text) as IAuthTokenResponse;
	} catch (error) {
		logger.error("auth token body was not json", {
			bodyPreview: text.slice(0, MAX_BODY_LOG_CHARS),
			error: String(error),
		});
		return { ok: false, error: "auth token body was not json" };
	}
	if (!payload.name) {
		logger.error("auth token response missing name", {
			keys: Object.keys(payload),
		});
		return { ok: false, error: "missing token name" };
	}
	logger.log("auth token issued", {
		tokenPrefix: payload.name.slice(0, 24),
		tokenLength: payload.name.length,
		expiresAt: body.expireTime,
	});
	return {
		ok: true,
		token: payload.name,
		expiresAt: body.expireTime,
		model: env.DUBBING_MODEL,
	};
};

export const GeminiLiveDubbingProvider: IDubbingProvider = {
	name: "gemini-live-translate",
	async createSession(env, request) {
		const first = await requestToken(env, request);
		if (first.ok) return first;
		logger.warn("first auth token attempt failed, retrying once", {
			error: first.error,
		});
		const second = await requestToken(env, request);
		if (!second.ok) {
			logger.error("second auth token attempt failed", { error: second.error });
		}
		return second;
	},
};
