export interface ICreateVideoRoomOptions {
	name: string;
	expiresAt: number;
	maxParticipants: number;
}

export interface ICreateVideoTokenOptions {
	roomName: string;
	userId: string;
	userName: string;
	expiresAt: number;
	isOwner: boolean;
}

export type IVideoRoomOutcome =
	| { ok: true; name: string; url: string }
	| { ok: false; error: string };

export type IVideoTokenOutcome =
	| { ok: true; token: string }
	| { ok: false; error: string };

export interface IVideoProvider {
	name: string;
	createRoom(
		env: Env,
		options: ICreateVideoRoomOptions,
	): Promise<IVideoRoomOutcome>;
	createToken(
		env: Env,
		options: ICreateVideoTokenOptions,
	): Promise<IVideoTokenOutcome>;
	deleteRoom(env: Env, name: string): Promise<void>;
}
