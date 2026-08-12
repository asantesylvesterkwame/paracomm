export type ITtsOutcome =
	| { ok: true; audioBase64: string; mimeType: "audio/wav" }
	| { ok: false; error: string };

export interface ITtsProvider {
	name: string;
	speak(env: Env, text: string, lang: string): Promise<ITtsOutcome>;
}
