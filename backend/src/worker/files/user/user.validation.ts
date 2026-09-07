import { z } from "zod";

export const updateMe = z
	.object({
		displayName: z.string().trim().min(1).max(60).optional(),
		preferredLang: z.string().trim().min(2).max(12).optional(),
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: "Provide at least one field to update",
	});

export type IUpdateMeBody = z.infer<typeof updateMe>;

export const getMe = z.object({
	locale: z.string().trim().min(2).max(64).optional(),
});

export type IGetMeQuery = z.infer<typeof getMe>;

export const searchUsers = z.object({
	query: z.string().trim().min(1).max(50),
	cursor: z.string().optional(),
});

export type ISearchUsersQuery = z.infer<typeof searchUsers>;
