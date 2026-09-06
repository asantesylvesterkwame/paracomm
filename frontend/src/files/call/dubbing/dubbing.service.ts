import { PARACOMM_API } from "@/api";
import type { IApiResult } from "@/interfaces/api.interface";
import type {
  IDubbingSessionData,
  IDubbingSessionRequest,
} from "./dubbing.interface";

class DubbingService {
  static async startSession(
    callId: string,
    payload: IDubbingSessionRequest,
  ): Promise<IApiResult<IDubbingSessionData>> {
    const response = await PARACOMM_API.post(
      `/calls/${callId}/dubbing`,
      payload,
      { timeout: 20000 },
    );
    return response.data;
  }
}

export default DubbingService;
