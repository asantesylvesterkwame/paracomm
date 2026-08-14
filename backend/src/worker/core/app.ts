import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import type { MiddlewareHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { registerRoutes } from "./routes";
import { generalMessages } from "./messages";
import { AppError } from "../utils/errors";
import { StatusCodes } from "../constants";
import type { AppEnv } from "./types";

const skipForWebSocket =
	(middleware: MiddlewareHandler): MiddlewareHandler =>
	(c, next) =>
		c.req.header("Upgrade") === "websocket" ? next() : middleware(c, next);

export const buildApp = () => {
	const app = new Hono<AppEnv>();

	app.use(skipForWebSocket(secureHeaders()));
	app.use(
		"*",
		skipForWebSocket(
			cors({
				origin: (origin, c) => {
					const origins: string = c.env.CORS_ORIGINS;
					const allowed = origins.split(",").map((entry) => entry.trim());
					return allowed.includes(origin) ? origin : "";
				},
				allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
				allowHeaders: ["Content-Type", "Authorization"],
				exposeHeaders: ["X-Quota-Day-Remaining", "Retry-After"],
			}),
		),
	);

	app.get("/", (c) =>
		c.json({ success: true, message: generalMessages.HEALTH_OK }),
	);

	registerRoutes(app);

	app.notFound((c) =>
		c.json(
			{ success: false, message: generalMessages.ROUTE_NOT_FOUND },
			StatusCodes.NOT_FOUND,
		),
	);

	app.onError((err, c) => {
		if (err instanceof AppError) {
			for (const [key, value] of Object.entries(err.headers ?? {})) {
				c.header(key, value);
			}
			return c.json(
				{ success: false, message: err.message },
				err.status as ContentfulStatusCode,
			);
		}
		console.error(err);
		return c.json(
			{ success: false, message: generalMessages.UNEXPECTED_FAILURE },
			StatusCodes.INTERNAL_SERVER_ERROR,
		);
	});

	return app;
};
