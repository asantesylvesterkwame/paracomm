import { Buffer } from "node:buffer";
import type {
	IVoiceNoteDubPayload,
	IVoiceNoteDubRow,
	IVoiceNotePayload,
	IVoiceNoteRow,
} from "./voice-note.model";

const EXTENSION_OF: Record<string, string> = {
	"audio/webm": "webm",
	"audio/ogg": "ogg",
	"audio/mp4": "m4a",
	"audio/wav": "wav",
};

const WAV_HEADER_BYTES = 44;

export const normalizeMime = (type: string) =>
	type.split(";")[0].trim().toLowerCase();

export const extensionOf = (mime: string) =>
	EXTENSION_OF[normalizeMime(mime)] ?? "bin";

export const originalObjectKey = (
	roomId: string,
	voiceNoteId: string,
	mime: string,
) => `voice-notes/${roomId}/${voiceNoteId}/original.${extensionOf(mime)}`;

export const dubObjectKey = (roomId: string, voiceNoteId: string, lang: string) =>
	`voice-notes/${roomId}/${voiceNoteId}/dubs/${lang}.wav`;

export const wavDurationMs = (bytes: Uint8Array) => {
	if (bytes.byteLength <= WAV_HEADER_BYTES) return 0;
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const channels = view.getUint16(22, true) || 1;
	const sampleRate = view.getUint32(24, true) || 24000;
	const bitsPerSample = view.getUint16(34, true) || 16;
	const bytesPerSecond = (sampleRate * channels * bitsPerSample) / 8;
	return Math.round(
		((bytes.byteLength - WAV_HEADER_BYTES) / bytesPerSecond) * 1000,
	);
};

export const toDubPayload = (dub: IVoiceNoteDubRow): IVoiceNoteDubPayload => {
	const { objectKey, ...rest } = dub;
	void objectKey;
	return rest;
};

export const toVoiceNotePayload = (
	row: IVoiceNoteRow,
	dubs: IVoiceNoteDubRow[],
): IVoiceNotePayload => {
	const { objectKey, ...rest } = row;
	void objectKey;
	return { ...rest, dubs: dubs.map(toDubPayload) };
};

export const bytesToBase64 = (buffer: ArrayBuffer) =>
	Buffer.from(buffer).toString("base64");

export const base64ToBytes = (base64: string) =>
	new Uint8Array(Buffer.from(base64, "base64"));

export const secondsOf = (durationMs: number) =>
	Math.max(1, Math.ceil(durationMs / 1000));
