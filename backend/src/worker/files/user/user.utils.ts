import UserRepository from "./user.repository";
import type { IActor } from "../../utils/auth";
import type { IUser } from "./user.model";

export class UserUtils {
	static async requireCurrentUser(
		env: Env,
		actor: IActor,
	): Promise<IUser | null> {
		return UserRepository.fetchOneByClerkId(env, actor.clerkId);
	}
}
