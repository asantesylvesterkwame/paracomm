import { PARACOMM_API } from "@/api";
import type { IApiResult } from "@/interfaces/api.interface";
import type { IMessage, IMessagesData } from "./message.interface";

class MessageService {
  static async getMessages(
    roomId: string,
    cursor?: string,
  ): Promise<IApiResult<IMessagesData>> {
    const response = await PARACOMM_API.get(`/rooms/${roomId}/messages`, {
      params: cursor ? { cursor } : {},
    });
    return response.data;
  }

  static async sendMessage(
    roomId: string,
    text: string,
  ): Promise<IApiResult<IMessage>> {
    const response = await PARACOMM_API.post(`/rooms/${roomId}/messages`, {
      text,
    });
    return response.data;
  }

  static async markSeen(
    roomId: string,
    lastSeenMessageId: string,
  ): Promise<IApiResult<{ roomId: string; lastSeenMessageId: string }>> {
    const response = await PARACOMM_API.post(`/rooms/${roomId}/seen`, {
      lastSeenMessageId,
    });
    return response.data;
  }

  static async retryTranslation(
    roomId: string,
    messageId: string,
  ): Promise<IApiResult<IMessage>> {
    const response = await PARACOMM_API.post(
      `/rooms/${roomId}/messages/${messageId}/translation`,
    );
    return response.data;
  }
}

export default MessageService;
