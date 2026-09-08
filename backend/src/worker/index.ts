import { buildApp } from "./core/app";
import CallService from "./files/call/call.service";
import VoiceNoteService from "./files/voice-note/voice-note.service";

const app = buildApp();

export { RoomDO } from "./durable/RoomDO";
export { UserDO } from "./durable/UserDO";

export default {
	fetch: app.fetch,
	async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
		ctx.waitUntil(
			Promise.all([
				CallService.sweepStaleCalls(env),
				VoiceNoteService.sweepStaleDubs(env),
			]),
		);
	},
} satisfies ExportedHandler<Env>;
