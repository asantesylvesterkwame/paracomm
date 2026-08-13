import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createDm, listRooms } from "./room.validation";
import {
	createDmController,
	listRoomsController,
	roomSocketController,
} from "./room.controller";
import {
	sendMessage,
	listMessages,
	markSeen,
} from "../message/message.validation";
import {
	sendMessageController,
	listMessagesController,
	markSeenController,
	retryTranslationController,
} from "../message/message.controller";
import { isAuthenticated } from "../../utils/auth";
import { validationHook } from "../../utils/validation";
import type { AppEnv } from "../../core/types";

const roomRoutes = new Hono<AppEnv>();

roomRoutes.get("/:roomId/ws", roomSocketController);

roomRoutes.use("*", isAuthenticated);

roomRoutes.post("/", zValidator("json", createDm, validationHook), createDmController);

roomRoutes.get(
	"/",
	zValidator("query", listRooms, validationHook),
	listRoomsController,
);

roomRoutes.post(
	"/:roomId/messages",
	zValidator("json", sendMessage, validationHook),
	sendMessageController,
);

roomRoutes.get(
	"/:roomId/messages",
	zValidator("query", listMessages, validationHook),
	listMessagesController,
);

roomRoutes.post(
	"/:roomId/seen",
	zValidator("json", markSeen, validationHook),
	markSeenController,
);

roomRoutes.post(
	"/:roomId/messages/:messageId/translation",
	retryTranslationController,
);

export default roomRoutes;
