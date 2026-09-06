import { PARACOMM_API } from "@/api";
import type { IApiResult } from "@/interfaces/api.interface";
import type {
  ICall,
  ICallCredentials,
  ICaptionTranslationData,
  ICaptionTranslationRequest,
} from "./call.interface";

class CallService {
  static async startCall(
    roomId: string,
  ): Promise<IApiResult<ICallCredentials>> {
    const response = await PARACOMM_API.post(`/rooms/${roomId}/calls`, {});
    return response.data;
  }

  static async joinCall(callId: string): Promise<IApiResult<ICallCredentials>> {
    const response = await PARACOMM_API.post(`/calls/${callId}/join`, {});
    return response.data;
  }

  static async declineCall(
    callId: string,
  ): Promise<IApiResult<{ call: ICall }>> {
    const response = await PARACOMM_API.post(`/calls/${callId}/decline`, {});
    return response.data;
  }

  static async endCall(
    callId: string,
    reason: "hangup" | "missed" = "hangup",
  ): Promise<IApiResult<{ call: ICall }>> {
    const response = await PARACOMM_API.post(`/calls/${callId}/end`, {
      reason,
    });
    return response.data;
  }

  static async translateCaption(
    callId: string,
    payload: ICaptionTranslationRequest,
  ): Promise<IApiResult<ICaptionTranslationData>> {
    const response = await PARACOMM_API.post(
      `/calls/${callId}/captions`,
      payload,
      { timeout: 20000 },
    );
    return response.data;
  }
}

export default CallService;
