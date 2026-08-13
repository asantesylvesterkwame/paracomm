import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { updateMe, searchUsers } from "./user.validation";
import {
	getMeController,
	updateMeController,
	searchUsersController,
} from "./user.controller";
import { isAuthenticated } from "../../utils/auth";
import { validationHook } from "../../utils/validation";
import type { AppEnv } from "../../core/types";

const userRoutes = new Hono<AppEnv>();

userRoutes.use("*", isAuthenticated);

userRoutes.get("/me", getMeController);

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
