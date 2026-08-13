import type { Hono } from "hono";
import liveRoutes from "../files/live/live.routes";
import userRoutes from "../files/user/user.routes";
import roomRoutes from "../files/room/room.routes";
import type { AppEnv } from "./types";

export const registerRoutes = (app: Hono<AppEnv>) => {
	const base = "/api/v1";
	app.route(`${base}/live`, liveRoutes);
	app.route(`${base}/users`, userRoutes);
	app.route(`${base}/rooms`, roomRoutes);
};
