import { PARACOMM_API } from "@/api";
import type { IApiResult } from "@/interfaces/api.interface";
import type { ICreateDmData, IRoomListData } from "./room.interface";

class RoomService {
  static async getRooms(cursor?: string): Promise<IApiResult<IRoomListData>> {
    const response = await PARACOMM_API.get("/rooms", {
      params: cursor ? { cursor } : {},
    });
    return response.data;
  }

  static async createDm(
    otherUserId: string,
  ): Promise<IApiResult<ICreateDmData>> {
    const response = await PARACOMM_API.post("/rooms", { otherUserId });
    return response.data;
  }
}

export default RoomService;
