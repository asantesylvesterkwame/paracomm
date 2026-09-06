import { DurableObject } from "cloudflare:workers";

export class UserDO extends DurableObject<Env> {
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

	async webSocketClose(ws: WebSocket, code: number) {
		try {
			ws.close(code, "closing");
		} catch {
			return;
		}
	}
}
