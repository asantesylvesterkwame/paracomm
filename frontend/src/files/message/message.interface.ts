export type TranslationStatus = "none" | "pending" | "done" | "failed";

export interface IMessage {
  id: string;
  roomId: string;
  senderId: string;
  originalText: string;
  originalLang: string;
  translatedText: string | null;
  translatedLang: string | null;
  translationStatus: TranslationStatus;
  translationError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IClientMessage extends IMessage {
  clientStatus?: "sending" | "failed";
}

export interface IMessagesData {
  items: IMessage[];
  nextCursor: string | null;
}

export interface ISeenPayload {
  roomId: string;
  userId: string;
  lastSeenMessageId: string;
}

export interface ITypingPayload {
  userId: string;
}

export interface MessageContextType {
  messages: IClientMessage[];
  isLoading: boolean;
  hasFetched: boolean;
  isLoadingMore: boolean;
  nextCursor: string | null;
  typingUserIds: string[];
  refetch: () => Promise<void>;
  loadOlder: () => Promise<void>;
  upsertMessage: (message: IClientMessage, replaceId?: string) => void;
  removeMessage: (id: string) => void;
}
