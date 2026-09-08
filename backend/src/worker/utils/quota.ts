export const hashIp = async (ip: string) => {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(ip),
	);
	return [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("")
		.slice(0, 16);
};

const secondsToUtcMidnight = () => {
	const now = new Date();
	const midnight = Date.UTC(
		now.getUTCFullYear(),
		now.getUTCMonth(),
		now.getUTCDate() + 1,
	);
	return Math.ceil((midnight - now.getTime()) / 1000);
};

const dayKey = () => new Date().toISOString().slice(0, 10).replaceAll("-", "");

const DAILY_TTL_SECONDS = 90000;

export interface IDailyBudgetOutcome {
	allowed: boolean;
	remaining: number;
	retryAfterSeconds: number;
}

const consumeDailyBudget = async (
	env: Env,
	key: string,
	budget: number,
	amount: number,
): Promise<IDailyBudgetOutcome> => {
	const used = Number((await env.LIVE_QUOTA.get(key)) ?? "0");
	if (used + amount > budget) {
		return {
			allowed: false,
			remaining: Math.max(0, budget - used),
			retryAfterSeconds: secondsToUtcMidnight(),
		};
	}
	await env.LIVE_QUOTA.put(key, String(used + amount), {
		expirationTtl: DAILY_TTL_SECONDS,
	});
	return {
		allowed: true,
		remaining: budget - used - amount,
		retryAfterSeconds: 0,
	};
};

const checkRateLimit = async (
	limiter: RateLimit | undefined,
	key: string,
	label: string,
) => {
	try {
		if (!limiter) throw new Error(`${label} binding missing`);
		const { success } = await limiter.limit({ key });
		return success;
	} catch (error) {
		console.warn(`${label} rate limit binding unavailable, failing open`, error);
		return true;
	}
};

export const checkMinuteLimit = (env: Env, key: string) =>
	checkRateLimit(env.LIVE_RPM, key, "live");

export const checkCaptionMinuteLimit = (env: Env, key: string) =>
	checkRateLimit(env.CAPTION_RPM, key, "caption");

export const checkDubbingMinuteLimit = (env: Env, key: string) =>
	checkRateLimit(env.DUBBING_RPM, key, "dubbing");

export const checkAndConsumeDailyChars = (
	env: Env,
	ipHash: string,
	chars: number,
) =>
	consumeDailyBudget(
		env,
		`live:day:${dayKey()}:${ipHash}`,
		Number(env.DAILY_CHAR_BUDGET),
		chars,
	);

export const checkAndConsumeUserDailyChars = (
	env: Env,
	userId: string,
	chars: number,
) =>
	consumeDailyBudget(
		env,
		`chat:day:${dayKey()}:${userId}`,
		Number(env.CHAT_DAILY_CHAR_BUDGET),
		chars,
	);

export type DailySecondsScope = "dub" | "voice";

const SECONDS_BUDGET_OF: Record<DailySecondsScope, (env: Env) => number> = {
	dub: (env) => Number(env.DUBBING_DAILY_SECONDS_BUDGET),
	voice: (env) => Number(env.VOICE_DAILY_SECONDS_BUDGET),
};

export const checkAndConsumeUserDailySeconds = (
	env: Env,
	userId: string,
	seconds: number,
	scope: DailySecondsScope = "dub",
) =>
	consumeDailyBudget(
		env,
		`${scope}:day:${dayKey()}:${userId}`,
		SECONDS_BUDGET_OF[scope](env),
		seconds,
	);
