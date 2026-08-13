export type ITranslationOutcome =
	| { ok: true; text: string; detectedLang?: string }
	| { ok: false; error: string };

export interface ITranslationProvider {
	name: string;
	translate(
		env: Env,
		text: string,
		sourceLang: string,
		targetLang: string,
	): Promise<ITranslationOutcome>;
}
