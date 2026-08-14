export type RoomEventName =
	| "message:new"
	| "message:updated"
	| "message:deleted"
	| "message:seen"
	| "typing:start"
	| "typing:stop"
	| "room:updated";

export class RoomEvents {
	static stub(env: Env, roomId: string) {
		return env.ROOM_DO.get(env.ROOM_DO.idFromName(roomId));
	}

	static async emit(
		env: Env,
		roomId: string,
		event: RoomEventName,
		payload: unknown,
	) {
		try {
			await this.stub(env, roomId).broadcast(event, payload);
		} catch (error) {
			console.error(`room event emit failed for ${roomId}`, error);
		}
	}

	static connect(env: Env, roomId: string, request: Request, userId: string) {
		const headers = new Headers(request.headers);
		headers.set("X-Actor-User-Id", userId);
		return this.stub(env, roomId).fetch(new Request(request, { headers }));
	}
}
