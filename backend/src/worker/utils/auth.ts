import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { verifyToken } from "@clerk/backend";
import { createMiddleware } from "hono/factory";
import { AppError } from "./errors";
import { generalMessages } from "../core/messages";
import { StatusCodes } from "../constants";
import type { AppEnv } from "../core/types";

export interface IActor {
	type: "user";
	clerkId: string;
}

export const isAuthenticated = createMiddleware<AppEnv>(async (c, next) => {
	if (!c.env.CLERK_SECRET_KEY) {
		throw new AppError(
			generalMessages.AUTH_NOT_CONFIGURED,
			StatusCodes.UNAUTHORIZED,
		);
	}
	await clerkMiddleware()(c, async () => {});
	const auth = getAuth(c);
	if (!auth?.userId) {
		throw new AppError(
			generalMessages.UNAUTHENTICATED,
			StatusCodes.UNAUTHORIZED,
		);
	}
	c.set("actor", { type: "user", clerkId: auth.userId });
	await next();
});

export const verifyWsToken = async (
	env: Env,
	token: string,
): Promise<string | null> => {
	if (!env.CLERK_SECRET_KEY || !token) return null;
	try {
		const payload = await verifyToken(token, {
			secretKey: env.CLERK_SECRET_KEY,
		});
		return payload.sub ?? null;
	} catch {
		return null;
	}
};
