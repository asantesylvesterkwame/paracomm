import { z } from "zod";

export const createDm = z.object({
	otherUserId: z.string().min(1),
});

export type ICreateDmBody = z.infer<typeof createDm>;

export const listRooms = z.object({
	cursor: z.string().optional(),
});

export type IListRoomsQuery = z.infer<typeof listRooms>;
