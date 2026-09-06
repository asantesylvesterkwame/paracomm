import type { ICallRow } from "./call.model";
import type { IUser } from "../user/user.model";

export const callDisplayName = (user: IUser) =>
	user.displayName ?? user.username ?? "Paracomm user";

export const buildCallSummary = (call: ICallRow) => ({
	id: call.id,
	roomId: call.roomId,
	initiatorId: call.initiatorId,
	messageId: call.messageId,
	status: call.status,
	answeredAt: call.answeredAt,
	endedAt: call.endedAt,
	expiresAt: call.expiresAt,
	createdAt: call.createdAt,
});

export type ICallSummary = ReturnType<typeof buildCallSummary>;
