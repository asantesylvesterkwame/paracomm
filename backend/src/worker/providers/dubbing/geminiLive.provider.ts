import type {
	IDubbingProvider,
	IDubbingOutcome,
	IDubbingSessionRequest,
} from "./dubbing.provider";

interface IAuthTokenResponse {
	name?: string;
}

const RECONNECT_WINDOW_SECONDS = 600;

const buildBody = (env: Env, request: IDubbingSessionRequest) => {
	const expiresAt = new Date(
		Date.now() + request.ttlSeconds * 1000,
	).toISOString();
	return {
		uses: Math.ceil(request.ttlSeconds / RECONNECT_WINDOW_SECONDS) + 2,
		expireTime: expiresAt,
		newSessionExpireTime: expiresAt,
		liveConnectConstraints: {
			model: `models/${env.DUBBING_MODEL}`,
			config: {
				responseModalities: ["AUDIO"],
				translationConfig: {
					targetLanguageCode: request.targetLang,
					echoTargetLanguage: false,
				},
				inputAudioTranscription: {},
				outputAudioTranscription: {},
			},
		},
	};
};

const requestToken = async (
	env: Env,
	request: IDubbingSessionRequest,
): Promise<IDubbingOutcome> => {
	const body = buildBody(env, request);
	const response = await fetch(
		"https://generativelanguage.googleapis.com/v1beta/auth_tokens",
		{
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-goog-api-key": env.GEMINI_API_KEY,
			},
			body: JSON.stringify(body),
		},
	);
	if (!response.ok) {
		return { ok: false, error: `gemini auth_tokens http ${response.status}` };
	}
	const payload = (await response.json()) as IAuthTokenResponse;
	if (!payload.name) {
		return { ok: false, error: "missing token name" };
	}
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
		return requestToken(env, request);
	},
};
