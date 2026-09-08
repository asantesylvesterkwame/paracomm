import { PARACOMM_API } from "@/api";
import type { IApiResult } from "@/interfaces/api.interface";
import type { IMessage } from "../message.interface";
import {
  VOICE_MEDIA_TIMEOUT_MS,
  VOICE_UPLOAD_TIMEOUT_MS,
} from "./voice-note.constants";
import { extensionOf } from "./voice-note.utils";
import type { IRecording, IRequestDubRequest } from "./voice-note.interface";

class VoiceNoteService {
  static async sendVoiceNote(
    roomId: string,
    recording: IRecording,
    clientId: string,
  ): Promise<IApiResult<IMessage>> {
    const form = new FormData();
    form.append(
      "audio",
      new File([recording.blob], `note.${extensionOf(recording.mimeType)}`, {
        type: recording.mimeType,
      }),
    );
    form.append("durationMs", String(recording.durationMs));
    form.append("clientId", clientId);
    const response = await PARACOMM_API.post(
      `/rooms/${roomId}/voice-notes`,
      form,
      { timeout: VOICE_UPLOAD_TIMEOUT_MS },
    );
    return response.data;
  }

  static async fetchMedia(
    roomId: string,
    voiceNoteId: string,
    lang?: string,
  ): Promise<Blob> {
    const response = await PARACOMM_API.get(
      `/rooms/${roomId}/voice-notes/${voiceNoteId}/media`,
      {
        params: lang ? { dub: lang } : undefined,
        responseType: "blob",
        timeout: VOICE_MEDIA_TIMEOUT_MS,
      },
    );
    return response.data;
  }

  static async requestDub(
    roomId: string,
    messageId: string,
    payload: IRequestDubRequest,
  ): Promise<IApiResult<IMessage>> {
    const response = await PARACOMM_API.post(
      `/rooms/${roomId}/messages/${messageId}/dubs`,
      payload,
    );
    return response.data;
  }
}

export default VoiceNoteService;
