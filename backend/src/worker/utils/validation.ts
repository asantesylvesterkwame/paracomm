import type { Context } from "hono";
import { generalMessages } from "../core/messages";
import { StatusCodes } from "../constants";

export const validationHook = (
	result: {
		success: boolean;
		error?: { issues: { path: PropertyKey[]; message: string }[] };
	},
	c: Context,
) => {
	if (!result.success && result.error) {
		return c.json(
			{
				success: false,
				message: generalMessages.VALIDATION_FAILED,
				errors: result.error.issues.map((issue) => ({
					field: issue.path.join("."),
					message: issue.message,
				})),
			},
			StatusCodes.UNPROCESSABLE,
		);
	}
};
