import { PARACOMM_API } from "@/api";
import type { IApiResult } from "@/interfaces/api.interface";
import type {
  ILiveSpeechData,
  ILiveSpeechRequest,
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

  static async speakUtterance(
    payload: ILiveSpeechRequest,
  ): Promise<IApiResult<ILiveSpeechData>> {
    const response = await PARACOMM_API.post("/live/speech", payload, {
      timeout: 30000,
    });
    return response.data;
  }
}

export default LiveService;
