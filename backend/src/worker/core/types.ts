import type { IActor } from "../utils/auth";

export type AppEnv = {
	Bindings: Env;
	Variables: {
		actor: IActor;
	};
};
