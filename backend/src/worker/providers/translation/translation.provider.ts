export type ITranslationMode = "chat" | "caption" | "auto";

export interface ITranslationOptions {
	mode?: ITranslationMode;
}

export type ITranslationOutcome =
	| { ok: true; text: string; detectedLang?: string }
	| { ok: false; error: string };

export interface ITranslationProvider {
	name: string;
	translate(
		env: Env,
		text: string,
		sourceLang: string | null,
		targetLang: string,
		options?: ITranslationOptions,
	): Promise<ITranslationOutcome>;
}
