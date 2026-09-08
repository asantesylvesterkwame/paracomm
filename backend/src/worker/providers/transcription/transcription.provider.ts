export interface ITranscriptionInput {
	audioBase64: string;
	mimeType: string;
}

export type ITranscriptionOutcome =
	| { ok: true; text: string }
	| { ok: false; error: string };

export interface ITranscriptionProvider {
	name: string;
	transcribe(
		env: Env,
		input: ITranscriptionInput,
	): Promise<ITranscriptionOutcome>;
}
