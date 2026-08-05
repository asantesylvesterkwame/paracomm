import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export const respond = (
	c: Context,
	status: number,
	payload: { success: boolean; message: string; data?: unknown; count?: number },
) => {
	return c.json(payload, status as ContentfulStatusCode);
};
