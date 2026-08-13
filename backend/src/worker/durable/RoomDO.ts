import { DurableObject } from "cloudflare:workers";

interface ISocketAttachment {
	userId: string;
}

const TYPING_EVENTS = new Set(["typing:start", "typing:stop"]);

export class RoomDO extends DurableObject<Env> {
	async fetch(request: Request): Promise<Response> {
		if (request.headers.get("Upgrade") !== "websocket") {
			return new Response("Expected websocket", { status: 426 });
		}
		const userId = request.headers.get("X-Actor-User-Id");
		if (!userId) {
			return new Response("Unauthorized", { status: 401 });
		}
		const pair = new WebSocketPair();
		const client = pair[0];
		const server = pair[1];
		this.ctx.acceptWebSocket(server, [userId]);
		server.serializeAttachment({ userId } satisfies ISocketAttachment);
		this.ctx.setWebSocketAutoResponse(
			new WebSocketRequestResponsePair("ping", "pong"),
		);
		return new Response(null, { status: 101, webSocket: client });
	}

	async broadcast(event: string, payload: unknown) {
		const frame = JSON.stringify({ event, payload });
		for (const socket of this.ctx.getWebSockets()) {
			try {
				socket.send(frame);
			} catch {
				continue;
			}
		}
	}

	async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
		if (typeof raw !== "string") return;
		let parsed: { event?: string };
		try {
			parsed = JSON.parse(raw);
		} catch {
			return;
		}
		if (!parsed.event || !TYPING_EVENTS.has(parsed.event)) return;
		const attachment = ws.deserializeAttachment() as ISocketAttachment | null;
		if (!attachment?.userId) return;
		const frame = JSON.stringify({
			event: parsed.event,
			payload: { userId: attachment.userId },
		});
		for (const socket of this.ctx.getWebSockets()) {
			if (socket === ws) continue;
			try {
				socket.send(frame);
			} catch {
				continue;
			}
		}
	}

	async webSocketClose(ws: WebSocket, code: number) {
		try {
			ws.close(code, "closing");
		} catch {
			return;
		}
	}
}
