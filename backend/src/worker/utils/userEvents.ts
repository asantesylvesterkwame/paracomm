export type UserEventName =
	| "call:ringing"
	| "call:accepted"
	| "call:declined"
	| "call:ended";

export class UserEvents {
	static stub(env: Env, userId: string) {
		return env.USER_DO.get(env.USER_DO.idFromName(userId));
	}

	static async emit(
		env: Env,
		userId: string,
		event: UserEventName,
		payload: unknown,
	) {
		try {
			await this.stub(env, userId).broadcast(event, payload);
		} catch (error) {
			console.error(`user event emit failed for ${userId}`, error);
		}
	}

	static async emitToMany(
		env: Env,
		userIds: string[],
		event: UserEventName,
		payload: unknown,
	) {
		await Promise.all(
			userIds.map((userId) => this.emit(env, userId, event, payload)),
		);
	}

	static connect(env: Env, userId: string, request: Request) {
		const headers = new Headers(request.headers);
		headers.set("X-Actor-User-Id", userId);
		return this.stub(env, userId).fetch(new Request(request, { headers }));
	}
}
