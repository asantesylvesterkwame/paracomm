import { PARACOMM_API } from "@/api";
import type { IApiResult } from "@/interfaces/api.interface";
import type {
  ILiveTranslationData,
  ILiveTranslationRequest,
} from "./live.interface";

class LiveService {
  static async translateUtterance(
    payload: ILiveTranslationRequest,
  ): Promise<IApiResult<ILiveTranslationData>> {
    const response = await PARACOMM_API.post("/live/translations", payload);
    return response.data;
  }
}

export default LiveService;
