import type { Hono } from "hono";
import liveRoutes from "../files/live/live.routes";

export const registerRoutes = (app: Hono<{ Bindings: Env }>) => {
	const base = "/api/v1";
	app.route(`${base}/live`, liveRoutes);
};
