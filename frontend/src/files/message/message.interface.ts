export type TranslationStatus = "none" | "pending" | "done" | "failed";

export type ClientMessageStatus = "sending" | "failed";

export type ClientMessageError = "network" | "rate" | "fatal";

export type MessageKind = "text" | "call";

export interface IMessage {
  id: string;
  roomId: string;
  clientId: string | null;
  senderId: string;
  kind: MessageKind;
  callId: string | null;
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
  clientStatus?: ClientMessageStatus;
  clientError?: ClientMessageError;
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

export interface IRoomSeen {
  lastSeenMessageId: string | null;
  lastSeenAt: string | null;
}

export interface IRoomMessagesState {
  items: IClientMessage[];
  nextCursor: string | null;
  hasFetched: boolean;
  isLoading: boolean;
  isRevalidating: boolean;
  isLoadingMore: boolean;
  isHydrated: boolean;
}

export interface IRoomMessagesView extends IRoomMessagesState {
  typingUserIds: string[];
  seen: IRoomSeen;
  pendingCount: number;
  failedCount: number;
}

export interface MessageContextType {
  byRoom: Record<string, IRoomMessagesState>;
  drafts: Record<string, string>;
  typingUserIds: string[];
  seenByRoom: Record<string, IRoomSeen>;
  getRoomState: (roomId: string | null) => IRoomMessagesState;
  setDraft: (roomId: string, draft: string) => void;
  refetch: (roomId: string, options?: { isSilent?: boolean }) => Promise<void>;
  loadOlder: (roomId: string) => Promise<void>;
  upsertMessage: (roomId: string, message: IClientMessage) => void;
  reconcileMessage: (
    roomId: string,
    message: IMessage,
    replaceId?: string,
  ) => void;
  patchMessage: (
    roomId: string,
    id: string,
    changes: Partial<IClientMessage>,
  ) => void;
  removeMessage: (roomId: string, id: string) => void;
  markRoomSeenLocally: (roomId: string, seen: IRoomSeen) => void;
}
