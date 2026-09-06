export interface IDubbingSessionRequest {
	targetLang: string;
	ttlSeconds: number;
}

export type IDubbingOutcome =
	| {
			ok: true;
			token: string;
			expiresAt: string;
			model: string;
	  }
	| { ok: false; error: string };

export interface IDubbingProvider {
	name: string;
	createSession(
		env: Env,
		request: IDubbingSessionRequest,
	): Promise<IDubbingOutcome>;
}
