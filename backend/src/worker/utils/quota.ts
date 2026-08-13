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

export const checkMinuteLimit = async (env: Env, ipHash: string) => {
	try {
		const { success } = await env.LIVE_RPM.limit({ key: ipHash });
		return success;
	} catch (error) {
		console.warn("rate limit binding unavailable, failing open", error);
		return true;
	}
};

export const checkAndConsumeDailyChars = async (
	env: Env,
	ipHash: string,
	chars: number,
) => {
	const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
	const key = `live:day:${day}:${ipHash}`;
	const budget = Number(env.DAILY_CHAR_BUDGET);
	const used = Number((await env.LIVE_QUOTA.get(key)) ?? "0");
	if (used + chars > budget) {
		return {
			allowed: false as const,
			remaining: Math.max(0, budget - used),
			retryAfterSeconds: secondsToUtcMidnight(),
		};
	}
	await env.LIVE_QUOTA.put(key, String(used + chars), {
		expirationTtl: 90000,
	});
	return {
		allowed: true as const,
		remaining: budget - used - chars,
		retryAfterSeconds: 0,
	};
};

export const checkAndConsumeUserDailyChars = async (
	env: Env,
	userId: string,
	chars: number,
) => {
	const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
	const key = `chat:day:${day}:${userId}`;
	const budget = Number(env.CHAT_DAILY_CHAR_BUDGET);
	const used = Number((await env.LIVE_QUOTA.get(key)) ?? "0");
	if (used + chars > budget) {
		return {
			allowed: false as const,
			remaining: Math.max(0, budget - used),
			retryAfterSeconds: secondsToUtcMidnight(),
		};
	}
	await env.LIVE_QUOTA.put(key, String(used + chars), {
		expirationTtl: 90000,
	});
	return {
		allowed: true as const,
		remaining: budget - used - chars,
		retryAfterSeconds: 0,
	};
};
