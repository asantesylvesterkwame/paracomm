import { PARACOMM_API } from "@/api";
import type { IApiResult } from "@/interfaces/api.interface";
import type {
  IProfileData,
  IUpdateMeRequest,
  IUser,
  IUserSearchData,
} from "./user.interface";

class UserService {
  static async getMe(): Promise<IApiResult<IProfileData>> {
    const response = await PARACOMM_API.get("/users/me");
    return response.data;
  }

  static async updateMe(
    payload: IUpdateMeRequest,
  ): Promise<IApiResult<{ user: IUser }>> {
    const response = await PARACOMM_API.patch("/users/me", payload);
    return response.data;
  }

  static async searchUsers(
    query: string,
    cursor?: string,
  ): Promise<IApiResult<IUserSearchData>> {
    const response = await PARACOMM_API.get("/users", {
      params: { query, ...(cursor ? { cursor } : {}) },
    });
    return response.data;
  }
}

export default UserService;
