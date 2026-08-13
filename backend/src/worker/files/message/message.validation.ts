import { z } from "zod";

export const sendMessage = z.object({
	text: z.string().trim().min(1).max(2000),
});

export type ISendMessageBody = z.infer<typeof sendMessage>;

export const listMessages = z.object({
	cursor: z.string().optional(),
});

export type IListMessagesQuery = z.infer<typeof listMessages>;

export const markSeen = z.object({
	lastSeenMessageId: z.string().min(1),
});

export type IMarkSeenBody = z.infer<typeof markSeen>;
