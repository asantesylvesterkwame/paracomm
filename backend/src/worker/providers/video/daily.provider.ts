import type { IVideoProvider } from "./video.provider";

const DAILY_API = "https://api.daily.co/v1";

interface IDailyRoomResponse {
	name?: string;
	url?: string;
	error?: string;
	info?: string;
}

interface IDailyTokenResponse {
	token?: string;
	error?: string;
	info?: string;
}

const dailyHeaders = (env: Env) => ({
	"content-type": "application/json",
	authorization: `Bearer ${env.DAILY_API_KEY}`,
});

export const DailyProvider: IVideoProvider = {
	name: "daily",

	async createRoom(env, options) {
		const response = await fetch(`${DAILY_API}/rooms`, {
			method: "POST",
			headers: dailyHeaders(env),
			body: JSON.stringify({
				name: options.name,
				privacy: "private",
				properties: {
					exp: options.expiresAt,
					eject_at_room_exp: true,
					max_participants: options.maxParticipants,
					enable_prejoin_ui: false,
					enable_screenshare: false,
					start_video_off: false,
					start_audio_off: false,
				},
			}),
		});
		const payload = (await response.json()) as IDailyRoomResponse;
		if (!response.ok || !payload.name || !payload.url) {
			return {
				ok: false,
				error: payload.info ?? payload.error ?? `daily http ${response.status}`,
			};
		}
		return { ok: true, name: payload.name, url: payload.url };
	},

	async createToken(env, options) {
		const response = await fetch(`${DAILY_API}/meeting-tokens`, {
			method: "POST",
			headers: dailyHeaders(env),
			body: JSON.stringify({
				properties: {
					room_name: options.roomName,
					user_id: options.userId,
					user_name: options.userName,
					exp: options.expiresAt,
					eject_at_token_exp: true,
					is_owner: options.isOwner,
					enable_screenshare: false,
				},
			}),
		});
		const payload = (await response.json()) as IDailyTokenResponse;
		if (!response.ok || !payload.token) {
			return {
				ok: false,
				error: payload.info ?? payload.error ?? `daily http ${response.status}`,
			};
		}
		return { ok: true, token: payload.token };
	},

	async deleteRoom(env, name) {
		try {
			await fetch(`${DAILY_API}/rooms/${name}`, {
				method: "DELETE",
				headers: dailyHeaders(env),
			});
		} catch (error) {
			console.error(`daily room delete failed for ${name}`, error);
		}
	},
};
