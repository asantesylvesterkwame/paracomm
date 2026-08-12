import { getTranslationProviders } from "../../providers/translation/translation.registry";
import { getTtsProviders } from "../../providers/tts/tts.registry";
import {
	hashIp,
	checkMinuteLimit,
	checkAndConsumeDailyChars,
} from "../../utils/quota";
import { liveMessages } from "./live.messages";
import type { ITranslateLiveBody, ISpeakLiveBody } from "./live.validation";

class LiveService {
	static async translate(env: Env, body: ITranslateLiveBody, clientIp: string) {
		const ipHash = await hashIp(clientIp);

		const minuteOk = await checkMinuteLimit(env, ipHash);
		if (!minuteOk) {
			return {
				success: false as const,
				message: liveMessages.MINUTE_LIMIT_REACHED,
				code: "RATE_MINUTE" as const,
				retryAfterSeconds: 60,
			};
		}

		const quota = await checkAndConsumeDailyChars(env, ipHash, body.text.length);
		if (!quota.allowed) {
			return {
				success: false as const,
				message: liveMessages.DAILY_LIMIT_REACHED,
				code: "RATE_DAY" as const,
				retryAfterSeconds: quota.retryAfterSeconds,
				remaining: quota.remaining,
			};
		}

		for (const provider of getTranslationProviders(env)) {
			const outcome = await provider.translate(
				env,
				body.text,
				body.sourceLang,
				body.targetLang,
			);
			if (outcome.ok) {
				return {
					success: true as const,
					message: liveMessages.TRANSLATED,
					data: {
						translation: outcome.text,
						provider: provider.name,
						sourceLang: body.sourceLang,
						targetLang: body.targetLang,
						remainingChars: quota.remaining,
					},
					remaining: quota.remaining,
				};
			}
			console.error(`translation provider ${provider.name} failed`, outcome.error);
		}

		return {
			success: false as const,
			message: liveMessages.PROVIDER_FAILED,
			code: "PROVIDER" as const,
		};
	}

	static async speak(env: Env, body: ISpeakLiveBody, clientIp: string) {
		const ipHash = await hashIp(clientIp);

		const minuteOk = await checkMinuteLimit(env, ipHash);
		if (!minuteOk) {
			return {
				success: false as const,
				message: liveMessages.MINUTE_LIMIT_REACHED,
				code: "RATE_MINUTE" as const,
				retryAfterSeconds: 60,
			};
		}

		for (const provider of getTtsProviders(env)) {
			const outcome = await provider.speak(env, body.text, body.lang);
			if (outcome.ok) {
				return {
					success: true as const,
					message: liveMessages.SPOKEN,
					data: {
						audioBase64: outcome.audioBase64,
						mimeType: outcome.mimeType,
						provider: provider.name,
						lang: body.lang,
					},
				};
			}
			console.error(`tts provider ${provider.name} failed`, outcome.error);
		}

		return {
			success: false as const,
			message: liveMessages.SPEECH_FAILED,
			code: "PROVIDER" as const,
		};
	}
}

export default LiveService;
