import { buildApp } from "./core/app";
import CallService from "./files/call/call.service";

const app = buildApp();

export { RoomDO } from "./durable/RoomDO";
export { UserDO } from "./durable/UserDO";

export default {
	fetch: app.fetch,
	async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
		ctx.waitUntil(CallService.sweepStaleCalls(env));
	},
} satisfies ExportedHandler<Env>;
