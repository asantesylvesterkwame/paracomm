import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getMe, updateMe, searchUsers } from "./user.validation";
import {
	getMeController,
	updateMeController,
	searchUsersController,
	userSocketController,
} from "./user.controller";
import { isAuthenticated } from "../../utils/auth";
import { validationHook } from "../../utils/validation";
import type { AppEnv } from "../../core/types";

const userRoutes = new Hono<AppEnv>();

userRoutes.get("/me/ws", userSocketController);

userRoutes.use("*", isAuthenticated);

userRoutes.get(
	"/me",
	zValidator("query", getMe, validationHook),
	getMeController,
);

userRoutes.patch(
	"/me",
	zValidator("json", updateMe, validationHook),
	updateMeController,
);

userRoutes.get(
	"/",
	zValidator("query", searchUsers, validationHook),
	searchUsersController,
);

export default userRoutes;
