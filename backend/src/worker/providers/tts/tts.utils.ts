import { Buffer } from "node:buffer";

export const pcmToWavBase64 = (
	pcmBase64: string,
	sampleRate = 24000,
	channels = 1,
	bitsPerSample = 16,
): string => {
	const pcm = Buffer.from(pcmBase64, "base64");
	const byteRate = (sampleRate * channels * bitsPerSample) / 8;
	const blockAlign = (channels * bitsPerSample) / 8;
	const header = new ArrayBuffer(44);
	const view = new DataView(header);
	const writeAscii = (offset: number, value: string) => {
		for (let i = 0; i < value.length; i += 1) {
			view.setUint8(offset + i, value.charCodeAt(i));
		}
	};
	writeAscii(0, "RIFF");
	view.setUint32(4, 36 + pcm.length, true);
	writeAscii(8, "WAVE");
	writeAscii(12, "fmt ");
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, channels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, byteRate, true);
	view.setUint16(32, blockAlign, true);
	view.setUint16(34, bitsPerSample, true);
	writeAscii(36, "data");
	view.setUint32(40, pcm.length, true);
	return Buffer.concat([Buffer.from(header), pcm]).toString("base64");
};
